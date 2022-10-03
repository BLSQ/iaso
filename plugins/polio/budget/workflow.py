from dataclasses import dataclass
from typing import Union, List, Optional

from iaso.models.microplanning import Team


@dataclass
class Transition:
    label: str
    key: str
    required_fields: []
    displayed_fields: []
    from_node: str = ""
    to_node: str = ""
    teams_ids_can_transition: Union[list, None] = None
    teams_ids_can_read: Union[list, None] = None
    help_text: str = ""
    allowed: Optional[bool] = None
    reason_not_allowed: Optional[str] = None


@dataclass
class Node:
    label: str
    key: str


@dataclass
class Workflow:
    transitions: List[Transition]
    nodes: List[Transition]


def next_transitions(transitions, current_node_key):
    nexts = [t for t in transitions if t.from_node == current_node_key]
    return nexts


def can_user_transition(transition: Transition, user):
    if not transition.teams_ids_can_transition:
        return True
    # is user is in one of the teams
    if Team.objects.filter(id__in=transition.teams_ids_can_transition).filter(users=user):
        return True
    return False


# Hardcoded workflow for testing.

transition_defs = [
    {
        "key": "submit_budget",
        "label": "Submit budget",
        "required_fields": ["files"],
        "displayed_fields": ["comment"],
        "from_node": None,
        "to_node": "budget_submitted",
        "teams_ids_can_transition": [100],
    },
    {
        "key": "accept_budget",
        "label": "Accept budget",
        "required_fields": [],
        "displayed_fields": ["comment"],
        "from_node": "budget_submited",
        "to_node": "accepted",
    },
    {
        "key": "reject budget",
        "label": "Provide feedback",
        "required_fields": [],
        "displayed_fields": ["comment"],
        "from_node": "budget_submitted",
        "to_node": "rejected",
    },
]

node_defs = [
    {"key": "budget_submitted", "label": "Budget submitted"},
    {"key": "accepted", "label": "Budget accepted"},
    {"key": "rejected", "label": "Budget rejected"},
]


def get_workflow():
    transitions = [Transition(**transition_def) for transition_def in transition_defs]
    nodes = [Node(**node_def) for node_def in node_defs]
    return Workflow(transitions, nodes)
