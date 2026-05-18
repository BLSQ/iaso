from iaso.models.validation_workflow.validation_node import ValidationNodeStatus


DEFAULT_COLOR = "#757575"  # equivalent to gray-600
MOBILE_STATUS_TO_COLOR = {
    ValidationNodeStatus.ACCEPTED: "#4CAF50",  # equivalent to Green-500
    ValidationNodeStatus.REJECTED: "#F44336",  # equivalent to RED-500
    ValidationNodeStatus.UNKNOWN: "#FFC107",  # equivalent to Amber-500
}
