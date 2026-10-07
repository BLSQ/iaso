from django.db.models import Func, TextField


class Decode(Func):
    function = "DECODE"

    def __init__(self, type: str, *expressions, **extra):
        super().__init__(*expressions, **extra)
        self.type = type

    def as_sql(
        self,
        compiler,
        connection,
        function=...,
        template=...,
        arg_joiner=...,
        **extra_context,
    ):
        return super().as_sql(
            compiler,
            connection,
            function="DECODE",
            template=f"%(function)s(%(expressions)s, '{self.type}')",
            **extra_context,
        )


class Encode(Func):
    function = "ENCODE"

    def __init__(self, type: str, *expressions, **extra):
        super().__init__(*expressions, output_field=TextField(), **extra)
        self.type = type

    def as_sql(
        self,
        compiler,
        connection,
        function=...,
        template=...,
        arg_joiner=...,
        **extra_context,
    ):
        return super().as_sql(
            compiler,
            connection,
            function="ENCODE",
            template=f"%(function)s(%(expressions)s, '{self.type}')",
            **extra_context,
        )
