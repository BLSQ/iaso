import copy

from collections import defaultdict

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import FieldDoesNotExist
from polymorphic.managers import PolymorphicManager
from polymorphic.query import PolymorphicQuerySet, transmogrify
from polymorphic.query_translate import (
    translate_polymorphic_field_path,
)


class RelatedPolymorphicQuerySet(PolymorphicQuerySet):
    """
    QuerySet for PolymorphicModel that supports related object prefetching
    Implementation taken from https://github.com/django-polymorphic/django-polymorphic/pull/531
    Examples:
    >>> queryset = Project.objects.select_polymorphic_related(
    >>>     ArtProject, 'artist', 'canvas__painter'
    >>> ).select_polymorphic_related(
    >>>     ResearchProject, 'supervisor',
    >>> )
    >>>
    >>> queryset = Project.objects.prefetch_polymorphic_related(
    >>>     ArtProject, 'artist', Prefetch('canvas', queryset=Project.objects.annotate(size=F('width') * F('height')))
    >>> ).prefetch_polymorphic_related(
    >>>     ResearchProject, 'authors',
    >>> )
    >>>
    >>> queryset = Project.objects.custom_queryset(ArtProject, ArtProject._base_objects.annotate(cost=F('cost') + F('canvas_cost'))))
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self._polymorphic_select_related = {}
        self._polymorphic_prefetch_related = {}
        self._polymorphic_custom_queryset = {}

    def _clone(self, *args, **kwargs):
        # Django's _clone only copies its own variables, so we need to copy ours here
        new = super()._clone(*args, **kwargs)
        new._polymorphic_select_related = copy.copy(self._polymorphic_select_related)
        new._polymorphic_prefetch_related = copy.copy(self._polymorphic_prefetch_related)
        new._polymorphic_custom_queryset = copy.copy(self._polymorphic_custom_queryset)
        return new

    def _get_real_instances(self, base_result_objects):
        """
        Polymorphic object loader
        Does the same as:
            return [ o.get_real_instance() for o in base_result_objects ]
        but more efficiently.
        The list base_result_objects contains the objects from the executed
        base class query. The class of all of them is self.model (our base model).
        Some, many or all of these objects were not created and stored as
        class self.model, but as a class derived from self.model. We want to re-fetch
        these objects from the db as their original class so we can return them
        just as they were created/saved.
        We identify these objects by looking at o.polymorphic_ctype, which specifies
        the real class of these objects (the class at the time they were saved).
        First, we sort the result objects in base_result_objects for their
        subclass (from o.polymorphic_ctype), and then we execute one db query per
        subclass of objects. Here, we handle any annotations from annotate().
        Finally we re-sort the resulting objects into the correct order and
        return them as a list.
        """
        resultlist = []  # polymorphic list of result-objects

        # dict contains one entry per unique model type occurring in result,
        # in the format idlist_per_model[modelclass]=[list-of-object-ids]
        idlist_per_model = defaultdict(list)
        indexlist_per_model = defaultdict(list)

        # django's automatic ".pk" field does not always work correctly for
        # custom fields in derived objects (unclear yet who to put the blame on).
        # We get different type(o.pk) in this case.
        # We work around this by using the real name of the field directly
        # for accessing the primary key of the the derived objects.
        # We might assume that self.model._meta.pk.name gives us the name of the primary key field,
        # but it doesn't. Therefore we use polymorphic_primary_key_name, which we set up in base.py.
        pk_name = self.model.polymorphic_primary_key_name

        # - sort base_result_object ids into idlist_per_model lists, depending on their real class;
        # - store objects that already have the correct class into "results"
        content_type_manager = ContentType.objects.db_manager(self.db)
        self_model_class_id = content_type_manager.get_for_model(self.model, for_concrete_model=False).pk
        self_concrete_model_class_id = content_type_manager.get_for_model(self.model, for_concrete_model=True).pk

        for i, base_object in enumerate(base_result_objects):
            if base_object.polymorphic_ctype_id == self_model_class_id:
                # Real class is exactly the same as base class, go straight to results
                resultlist.append(base_object)
            else:
                real_concrete_class = base_object.get_real_instance_class()
                real_concrete_class_id = base_object.get_real_concrete_instance_class_id()

                if real_concrete_class_id is None:
                    # Dealing with a stale content type
                    continue
                if real_concrete_class_id == self_concrete_model_class_id:
                    # Real and base classes share the same concrete ancestor,
                    # upcast it and put it in the results
                    resultlist.append(transmogrify(real_concrete_class, base_object))
                else:
                    # This model has a concrete derived class, track it for bulk retrieval.
                    real_concrete_class = content_type_manager.get_for_id(real_concrete_class_id).model_class()
                    idlist_per_model[real_concrete_class].append(getattr(base_object, pk_name))
                    indexlist_per_model[real_concrete_class].append((i, len(resultlist)))
                    resultlist.append(None)

        # For each model in "idlist_per_model" request its objects (the real model)
        # from the db and store them in results[].
        # Then we copy the annotate fields from the base objects to the real objects.
        # Then we copy the extra() select fields from the base objects to the real objects.
        # TODO: defer(), only(): support for these would be around here
        for real_concrete_class, idlist in idlist_per_model.items():
            indices = indexlist_per_model[real_concrete_class]
            if self._polymorphic_custom_queryset.get(real_concrete_class):
                real_objects = self._polymorphic_custom_queryset[real_concrete_class]
            else:
                real_objects = real_concrete_class._base_objects.db_manager(self.db)

            real_objects = real_objects.filter(**{("%s__in" % pk_name): idlist})

            # copy select_related() fields from base objects to real objects
            real_objects.query.select_related = self.query.select_related

            # polymorphic select_related() fields if any
            if real_concrete_class in self._polymorphic_select_related:
                real_objects = real_objects.select_related(*self._polymorphic_select_related[real_concrete_class])

                # polymorphic prefetch related configuration to new qs
            if real_concrete_class in self._polymorphic_prefetch_related:
                real_objects = real_objects.prefetch_related(*self._polymorphic_prefetch_related[real_concrete_class])

            # Copy deferred fields configuration to the new queryset
            deferred_loading_fields = []
            existing_fields = self.polymorphic_deferred_loading[0]
            for field in existing_fields:
                try:
                    translated_field_name = translate_polymorphic_field_path(real_concrete_class, field)
                except AssertionError:
                    if "___" in field:
                        # The originally passed argument to .defer() or .only()
                        # was in the form Model2B___field2, where Model2B is
                        # now a superclass of real_concrete_class. Thus it's
                        # sufficient to just use the field name.
                        translated_field_name = field.rpartition("___")[-1]

                        # Check if the field does exist.
                        # Ignore deferred fields that don't exist in this subclass type.
                        try:
                            real_concrete_class._meta.get_field(translated_field_name)
                        except FieldDoesNotExist:
                            continue
                    else:
                        raise

                deferred_loading_fields.append(translated_field_name)
            real_objects.query.deferred_loading = (
                set(deferred_loading_fields),
                self.query.deferred_loading[1],
            )

            real_objects_dict = {getattr(real_object, pk_name): real_object for real_object in real_objects}

            for i, j in indices:
                base_object = base_result_objects[i]
                o_pk = getattr(base_object, pk_name)
                real_object = real_objects_dict.get(o_pk)
                if real_object is None:
                    continue

                # need shallow copy to avoid duplication in caches (see PR #353)
                real_object = copy.copy(real_object)
                real_class = real_object.get_real_instance_class()

                # If the real class is a proxy, upcast it
                if real_class != real_concrete_class:
                    real_object = transmogrify(real_class, real_object)

                if self.query.annotations:
                    for anno_field_name in self.query.annotations.keys():
                        attr = getattr(base_object, anno_field_name)
                        setattr(real_object, anno_field_name, attr)

                if self.query.extra_select:
                    for select_field_name in self.query.extra_select.keys():
                        attr = getattr(base_object, select_field_name)
                        setattr(real_object, select_field_name, attr)

                resultlist[j] = real_object

        resultlist = [i for i in resultlist if i]

        # set polymorphic_annotate_names in all objects (currently just used for debugging/printing)
        if self.query.annotations:
            # get annotate field list
            annotate_names = list(self.query.annotations.keys())
            for real_object in resultlist:
                real_object.polymorphic_annotate_names = annotate_names

        # set polymorphic_extra_select_names in all objects (currently just used for debugging/printing)
        if self.query.extra_select:
            # get extra select field list
            extra_select_names = list(self.query.extra_select.keys())
            for real_object in resultlist:
                real_object.polymorphic_extra_select_names = extra_select_names

        return resultlist

    def select_polymorphic_related(self, polymorphic_subclass, *fields):
        if self.query.select_related is True:
            raise ValueError("select_polymorphic_related() cannot be used together with select_related=True")
        clone = self._clone()
        clone._polymorphic_select_related[polymorphic_subclass] = fields
        return clone

    def prefetch_polymorphic_related(self, polymorphic_subclass, *lookups):
        clone = self._clone()
        clone._polymorphic_prefetch_related[polymorphic_subclass] = lookups
        return clone

    def custom_queryset(self, polymorphic_subclass, queryset):
        clone = self._clone()
        clone._polymorphic_custom_queryset[polymorphic_subclass] = queryset
        return clone


class RelatedPolymorphicManager(PolymorphicManager):
    queryset_class = RelatedPolymorphicQuerySet
