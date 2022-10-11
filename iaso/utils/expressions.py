# taken from django/django/contrib/postgres/expressions.py
# which was introduced in django 4.1
# FIXME : When upgrading to django >= 4.1, please remove this file
# and replace the code that import it with
# ```from django.contrib.postgres.expressions import ArraySubquery```
from django.contrib.postgres.fields import ArrayField
from django.db.models import Subquery
from django.utils.functional import cached_property


class ArraySubquery(Subquery):
    template = "ARRAY(%(subquery)s)"

    def __init__(self, queryset, **kwargs):
        super().__init__(queryset, **kwargs)

    @cached_property
    def output_field(self):
        return ArrayField(self.query.output_field)
