from hat.planning.models import Assignation


def reassign_planning(ordered, planning):
    for index, obj in enumerate(ordered):
        Assignation.objects.filter(
            planning=planning, village_id=obj["village_id"]
        ).delete()
        assignation = Assignation()
        assignation.planning = planning
        assignation.index = obj["index"]
        assignation.month = obj["month"]
        assignation.village_id = obj["village_id"]
        assignation.team_id = obj["team_id"]
        assignation.save()
