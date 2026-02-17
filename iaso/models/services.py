from .risp import Workflow, WorkflowInstance, Node, Transition
from .engine import WorkflowEngine
from django.contrib.contenttypes.models import ContentType


def create_workflow_with_start_end(name):
    workflow = Workflow.objects.create(name=name)
    start = Node.objects.create(workflow=workflow, name="Start", type=Node.NodeType.START)
    end = Node.objects.create(workflow=workflow, name="End", type=Node.NodeType.END)
    Transition.objects.create(from_node=start, to_node=end)
    return workflow


def add_task_step(workflow, name, position_node=None):
    start_node = workflow.nodes.get(type=Node.NodeType.START)
    end_node = workflow.nodes.get(type=Node.NodeType.END)

    if not position_node:
        position_node = start_node

    new_node = Node.objects.create(workflow=workflow, name=name, type=Node.NodeType.TASK)

    # redirect transition
    next_transition = Transition.objects.filter(from_node=position_node).first()
    next_node = next_transition.to_node if next_transition else end_node
    if next_transition:
        next_transition.delete()

    Transition.objects.create(from_node=position_node, to_node=new_node)
    Transition.objects.create(from_node=new_node, to_node=next_node)
    return new_node


def create_workflow_instance(workflow, entity):
    if not workflow.is_entity_allowed(entity):
        raise ValueError("Workflow cannot be attached to this entity type")

    ct = ContentType.objects.get_for_model(entity)
    instance = WorkflowInstance.objects.create(workflow=workflow, content_type=ct, object_id=entity.pk)
    return instance