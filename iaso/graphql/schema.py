import strawberry

from strawberry.extensions import MaxAliasesLimiter, MaxTokensLimiter, QueryDepthLimiter
from strawberry_django.optimizer import DjangoOptimizerExtension

from iaso.graphql.org_units.queries import OrgUnitQuery


@strawberry.type
class Query(OrgUnitQuery):
    pass


schema = strawberry.Schema(
    query=Query,
    extensions=[
        DjangoOptimizerExtension(),
        # a selection can be cheap or expensive (geometries, counts): bound how much one document can ask for
        QueryDepthLimiter(max_depth=8),
        MaxAliasesLimiter(max_alias_count=15),
        MaxTokensLimiter(max_token_count=2_000),
    ],
)
