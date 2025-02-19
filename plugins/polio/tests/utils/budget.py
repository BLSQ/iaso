from plugins.polio.budget.workflow import Category, Node, Transition, Workflow


transition_defs = [
    {
        "displayed_fields": ["comment"],
        "from_node": "-",
        "key": "submit_budget",
        "label": "Submit budget",
        "required_fields": [],
        "teams_ids_can_transition": [],
        "to_node": "budget_submitted",
    },
    {
        "color": "green",
        "displayed_fields": ["comment"],
        "from_node": "budget_submitted",
        "key": "accept_budget",
        "label": "Accept budget",
        "required_fields": [],
        "to_node": "accepted",
    },
    {
        "color": "primary",
        "displayed_fields": ["comment"],
        "from_node": "budget_submitted",
        "key": "reject_budget",
        "label": "Provide feedback",
        "required_fields": [],
        "to_node": "rejected",
    },
    {
        "color": "red",
        "displayed_fields": [],
        "emails_to_send": [],
        "from_node": "any",
        "key": "override",
        "label": "Override",
        "required_fields": [],
        "teams_ids_can_transition": [],
        "to_node": "any",
    },
]

node_defs = [
    {"key": None, "label": "No budget", "category_key": "category_1"},
    {"key": "budget_submitted", "label": "Budget submitted", "category_key": "category_1"},
    {"key": "accepted", "label": "Budget accepted", "category_key": "category_2"},
    {"key": "rejected", "label": "Budget rejected", "category_key": "category_2"},
]

categories_defs = [
    {"key": "category_1", "label": "Category 1"},
    {"key": "category_2", "label": "Category 2"},
]


def get_mocked_workflow():
    """
    Hardcoded workflow for testing.
    """
    transitions = [Transition(**transition_def) for transition_def in transition_defs]
    nodes = [Node(**node_def) for node_def in node_defs]
    categories = [Category(**categories_def) for categories_def in categories_defs]
    return Workflow(transitions=transitions, nodes=nodes, categories=categories)
