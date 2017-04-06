from django.db.models import Q
from hat.import_export.typing import ResultValues

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
