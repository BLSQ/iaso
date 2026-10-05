"""Resolvers of the `Task` fields that aren't a plain attribute."""

from ariadne import ObjectType


task = ObjectType("Task")


@task.field("errors")
def resolve_errors(task, _info):
    # a refused input (`org_units.mutations.refuse()`), else nothing
    return (task.result or {}).get("errors", [])
