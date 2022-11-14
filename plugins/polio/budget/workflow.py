from dataclasses import dataclass, field
from typing import Union, List, Optional, Tuple

from iaso.models.microplanning import Team

# Move to typing import Litteral when upgrading to python 3.8
from typing_extensions import Literal

# attachment is either file or a links
FieldName = Literal["comment", "amount", "attachments"]


@dataclass
class Transition:
    label: str
    key: str
    required_fields: List[str]
    displayed_fields: List[str]
    from_node: str = ""
    to_node: str = ""
    teams_ids_can_transition: Union[list, None] = None  # if none unrestricted
    teams_ids_can_view: Union[list, None] = None  # if none unrestricted
    help_text: str = ""
    allowed: Optional[bool] = None
    reason_not_allowed: Optional[str] = None
    color: Optional[str] = None  # one of primary, red, green
    # mail_template_slug, [team_ids]
    emails_to_send: List[Tuple[str, List[int]]] = field(default_factory=list)


@dataclass
class Node:
    label: str
    key: str
    category_key: str = ""
    order: int = 0
    mandatory: bool = False


@dataclass
class Category:
    label: str
    key: str
    nodes: Optional[List[Node]] = None  # Added at workflow init


@dataclass
class Workflow:
    transitions: List[Transition]
    nodes: List[Node]
    categories: List[Category]
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

    def get_transition_label_safe(self, key) -> str:
        """Return the label for this transition key. Or the label itself it the
        key is not found in the workfloe e.g. it was deleted"""
        if key in self.transitions_dict:
            return self.transitions_dict[key].label
        else:
            return key

    def self_check(self):
        for transition in self.transitions:
            if transition.from_node:
                self.get_node_by_key(transition.to_node)
            if transition.to_node:
                self.get_node_by_key(transition.to_node)

    def _get_nodes_in_category(self, category_key):
        nodes = [node for node in self.nodes if node.category_key == category_key]
        return nodes

    def __init__(self, transitions, nodes, categories):
        self.nodes = nodes
        self.categories = categories
        self.transitions = transitions
        # link categories to node
        for category in self.categories:
            nodes = self._get_nodes_in_category(category.key)
            nodes.sort(key=lambda n: n.order)
            category.nodes = nodes


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
