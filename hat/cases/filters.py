'''

Case filters
============

This is the list of different test used to determine the participant HAT results.

    +--------------+--------------------------+
    | Used in…     | Test                     |
    +==============+==========================+
    | screening    | test_catt                |
    +              +--------------------------+
    |              | test_rdt                 |
    +--------------+--------------------------+
    | confirmation | test_ctcwoo              |
    +              +--------------------------+
    |              | test_ge                  |
    +              +--------------------------+
    |              | test_lcr                 |
    +              +--------------------------+
    |              | test_lymph_node_puncture |
    +              +--------------------------+
    |              | test_maect               |
    +              +--------------------------+
    |              | test_pg                  |
    +              +--------------------------+
    |              | test_sf                  |
    +--------------+--------------------------+

.. note:: Any change on the list of test classification could affect the global
          results and an App **restart** to refresh :class:`hat.cases.models.CaseView`
          entries is recommended afterwards.
'''

from enum import IntEnum, unique
from django.db.models import Q


# list of tests used in screening sessions
screening_tests = (
    'test_catt',
    'test_rdt',
)

# list of tests used to confirm the disease
confirmation_tests = (
    'test_ctcwoo',
    'test_ge',
    'test_lcr',
    'test_lymph_node_puncture',
    'test_maect',
    'test_pg',
    'test_sf',
)


@unique
class ResultValues(IntEnum):
    '''
    Possible test values.

    The values indicate the order of importance/relevance and it's used to
    compare different tests on the same participant to decide the
    final HAT result.

    +----------+-------+
    | Result   | Value |
    +==========+=======+
    | positive |     2 |
    +----------+-------+
    | negative |     1 |
    +----------+-------+
    | absent   |     0 |
    +----------+-------+
    | missing  |    -1 |
    +----------+-------+

    .. warning:: Any change on the values should affect the global results and
                 a **reimport** (:func:`hat.import_export.reimport.reimport`)
                 execution is mandatory afterwards.
    '''

    positive = 2
    negative = 1
    absent = 0
    missing = -1


Q_screening = Q(screening_result__isnull=False)
Q_screening_positive = Q(screening_result=ResultValues.positive.value)
Q_screening_negative = Q(screening_result=ResultValues.negative.value)

Q_confirmation = Q(confirmation_result__isnull=False)
Q_confirmation_positive = Q(confirmation_result=ResultValues.positive.value)
Q_confirmation_negative = Q(confirmation_result=ResultValues.negative.value)

Q_staging = Q(stage_result__isnull=False)
Q_staging_stage1 = Q(stage_result='stage1')
Q_staging_stage2 = Q(stage_result='stage2')

Q_is_suspect = Q(Q_screening_positive & ~Q_confirmation & ~Q_staging)

# this dictionary is used in the API methods
test_results = {name: member.value for (name, member) in ResultValues.__members__.items()}

# list of test values in order of importance
# values should be cast as str due to the ``0`` are ignored
test_values_in_order = sorted(
    (str(member.value) for (_, member) in ResultValues.__members__.items()),
    reverse=True)
