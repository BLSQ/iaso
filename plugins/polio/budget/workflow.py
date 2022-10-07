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
    teams_ids_can_transition: Union[list, None] = None  # if none unrestricted
    teams_ids_can_view: Union[list, None] = None  # if none unrestricted
    help_text: str = ""
    allowed: Optional[bool] = None
    reason_not_allowed: Optional[str] = None
    color: Optional[str] = None  # one of primary, red, green


@dataclass
class Node:
    label: str
    key: str


@dataclass
class Workflow:
    transitions: List[Transition]
    nodes: List[Node]
    _transitions_dict = None

    def get_node_by_key(self, key):
        nodes = [node for node in self.nodes if node.key == key]
        if not nodes:
            raise ValueError("Node not found")
        return nodes[0]

    @property
    def transitions_dict(self):
        if not self._transitions_dict:
            self._transitions_dict = {t.key: t for t in self.transitions}
        return self._transitions_dict

    def get_transition_by_key(self, key) -> Transition:
        return self.transitions_dict[key]

    def self_check(self):
        for transition in self.transitions:
            if transition.from_node:
                self.get_node_by_key(transition.to_node)
            if transition.to_node:
                self.get_node_by_key(transition.to_node)


def next_transitions(transitions, current_node_key):
    nexts = [t for t in transitions if t.from_node == current_node_key]
    return nexts


def can_user_transition(transition: Transition, user):
    if not transition.teams_ids_can_transition:
        return True
    # is user is in one of the teams
    if Team.objects.filter(id__in=transition.teams_ids_can_transition).filter(users=user).exists():
        return True
    return False


# Hardcoded workflow for testing.

transition_defs = [
    {
        "key": "submit_budget",
        "label": "Submit budget",
        # "required_fields": ["files"],
        "required_fields": [],
        "displayed_fields": ["comment"],
        "from_node": None,
        "to_node": "budget_submitted",
        "teams_ids_can_transition": [],
    },
    {
        "key": "accept_budget",
        "label": "Accept budget",
        "required_fields": [],
        "displayed_fields": ["comment"],
        "from_node": "budget_submitted",
        "to_node": "accepted",
        "color": "green",
    },
    {
        "key": "reject_budget",
        "label": "Provide feedback",
        "required_fields": [],
        "displayed_fields": ["comment"],
        "from_node": "budget_submitted",
        "to_node": "rejected",
        "color": "red",
    },
]

node_defs = [
    {"key": "budget_submitted", "label": "Budget submitted"},
    {"key": "accepted", "label": "Budget accepted"},
    {"key": "rejected", "label": "Budget rejected"},
]


# FIXME Add cache
def get_workflow():
    transitions = [Transition(**transition_def) for transition_def in transition_defs]
    nodes = [Node(**node_def) for node_def in node_defs]
    return Workflow(transitions, nodes)
