from autoslug import AutoSlugField
from autoslug.utils import crop_slug, get_prepopulated_value


class BulkAutoSlugField(AutoSlugField):
    def generate_slug_for_bulk_create(self, instance, existing_slugs=None):
        if existing_slugs is None:
            existing_slugs = set()

        value = self.value_from_object(instance)

        # autopopulate
        if self.always_update or (self.populate_from and not value):
            value = get_prepopulated_value(self, instance)

            # pragma: nocover
            if __debug__ and not value and not self.blank:
                print(
                    "Failed to populate slug %s.%s from %s"
                    % (instance._meta.object_name, self.name, self.populate_from)
                )

        slug = None
        if value:
            slug = self.slugify(value)
        if not slug:
            slug = None

            if not self.blank:
                slug = instance._meta.model_name
            elif not self.null:
                slug = ""

        if slug:
            slug = self.slugify(crop_slug(self, slug))

        # ensure the slug is unique
        if self.unique or self.unique_with:
            base_slug = slug
            i = 1
            while slug in existing_slugs:
                slug = f"{base_slug}-{i}"
                i += 1
        return slug
