from rest_framework import viewsets
from rest_framework.response import Response
from hat.quality.models import Test
from hat.constants import CATT, RDT, PG
from hat.users.models import Team, Coordination

from django.shortcuts import get_object_or_404
from hat.api.coordination import is_user_coordination_authorized

class QCCheckStatsViewSet(viewsets.ViewSet):
    """
    Api to get statistics for the quality control tool.
    """
    permission_required = [
        'menupermissions.x_qualitycontrol'
    ]
    def list(self, request):
        test_types = [CATT, RDT, PG]

        team_type = request.GET.get("type", None)
        coordination_id = request.GET.get("coordination", None)
        from_date = request.GET.get("from", None)
        to_date = request.GET.get("to", None)
        order = request.GET.get("order", None)

        teams = Team.objects.all()
        if coordination_id:
            coordination = get_object_or_404(Coordination, pk=coordination_id)
            is_authorized = is_user_coordination_authorized(coordination, request.user)
            if not is_authorized:
                return Response('Unauthorized', status=401)
            teams = teams.filter(coordination_id=coordination_id)

        if team_type:
            teams = teams.filter(UM=(team_type == 'UM'))

        tests = Test.objects.all()

        if from_date:
            tests = tests.filter(date__date__gte=from_date)

        if to_date:
            tests = tests.filter(date__date__lte=to_date)

        tests = tests.filter(type__in=test_types)
        tests = tests.filter(team__in=teams)
        tests = tests.prefetch_related('check_set')

        class TypeCounts:
            def __init__(self):
                self.test_count = 0
                self.checked_test_count = 0
                self.match_count = 0

        temp_dict = {}
        for team in teams:
            d = {'id': team.id, 'name': team.name, 'UM': team.UM}
            for t in test_types:
                d[t] = TypeCounts()
            temp_dict[team.id] = d

        for test in tests:
            type_counts = temp_dict[test.team_id][test.type]
            type_counts.test_count += 1
            if test.check_set.count() != 0:
                type_counts.checked_test_count += 1
                match = True
                for check in test.check_set.all():
                    if check.result != test.result:
                        match = False

                if match:
                    type_counts.match_count += 1
        res = []
        for team_id in temp_dict:
            team_dict = temp_dict[team_id]
            json_dict = {
                'id': team_dict['id'],
                'name': team_dict['name'],
                'UM': team_dict['UM']
            }

            for the_type in test_types:
                json_dict[the_type] = vars(team_dict[the_type])

            res.append(json_dict)

        if order is None:
            order = 'name'

        reverse = order.startswith('-')

        if reverse:
            order = order[1:]

        res = sorted(res, key=lambda k: k[order], reverse=reverse)

        return Response(res)
