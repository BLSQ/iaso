from django.db.models import Field, Func, TextField


class JsonbPathQueryFirst(Func):
    """
    Wrapper for PostgreSQL jsonb_path_query_first.
    Syntax: jsonb_path_query_first(target_json, path_expression)
    """

    # This specifically strips the quotes by casting the result to text #>> '{}'
    template = "(jsonb_path_query_first(%(expressions)s) #>> '{}')"
    output_field = TextField()


# 1. Helper for Regex Replace (to strip extensions)
class RegexpReplace(Func):
    function = "REGEXP_REPLACE"
    output_field = TextField()


class JsonPathField(Field):
    def db_type(self, connection):
        return "jsonpath"
