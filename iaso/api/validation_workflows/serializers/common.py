from rest_framework import serializers


class UserDisplayNameField(serializers.CharField):
    def __init__(self, **kwargs):
        kwargs["read_only"] = True
        kwargs["allow_blank"] = True
        super().__init__(**kwargs)

    def to_representation(self, value):
        if value is None:
            return None
        full_name = value.get_full_name()
        if full_name:
            return full_name
        return getattr(value, "username", "")


def get_ordered_node_templates(workflow):
    """
    Steps of the workflow in chain order, from the starting step to the last one.
    Uses the prefetched `node_templates` with their next and previous steps when available.
    """
    nodes = list(workflow.node_templates.all())
    # Next steps are mapped back to the steps of `nodes`, which carry the prefetched relations
    nodes_by_id = {node.id: node for node in nodes}
    next_map = {node.id: list(node.next_node_templates.all()) for node in nodes}
    prev_map = {node.id: list(node.previous_node_templates.all()) for node in nodes}

    ordered = []
    current = next((node for node in nodes if not prev_map[node.id]), None)
    while current:
        ordered.append(current)
        next_nodes = next_map[current.id]
        current = nodes_by_id.get(next_nodes[0].id) if next_nodes else None
    return ordered
