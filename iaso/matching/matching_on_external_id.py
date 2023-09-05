from datetime import datetime

from iaso.models import OrgUnit, MatchingAlgorithm, Link, AlgorithmRun


class Algorithm:
    description = "ID Matching"

    def match(self, version_1, version_2, user=None):
        algo, created = MatchingAlgorithm.objects.get_or_create(
            name=__name__, defaults={"description": self.description}
        )
        run = AlgorithmRun()
        run.algorithm = algo
        run.version_1 = version_1
        run.version_2 = version_2
        if user:
            run.launcher = user
        run.save()

        units1 = list(
            OrgUnit.objects.filter(version_id=version_1).exclude(source_ref=None).values_list("id", "source_ref")
        )
        units2 = list(
            OrgUnit.objects.filter(version=version_2).exclude(source_ref=None).values_list("id", "source_ref")
        )
        units2_dict = {t[1]: t[0] for t in units2}

        links = []
        for t1 in units1:
            unit_2 = units2_dict.get(t1[1], None)
            if unit_2:
                link = Link()
                link.destination_id = t1[0]
                link.source_id = unit_2
                link.algorithm_run = run
                link.similarity_score = 100
                link.save()
                links.append(link)

        result = {"items matched": len(links)}
        run.ended_at = datetime.now()
        run.result = result
        run.finished = True
        run.save()
