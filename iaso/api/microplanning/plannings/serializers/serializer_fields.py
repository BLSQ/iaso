class CurrentPlanningDefault:
    requires_context = True

    def __call__(self, serializer_field):
        return serializer_field.context["planning_id"]
