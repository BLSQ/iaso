from django.db.models import Q

Q_screening = Q(screening_result__isnull=False)
Q_screening_positive = Q(screening_result=True)
Q_screening_negative = Q(screening_result=False)

Q_confirmation = Q(confirmation_result__isnull=False)
Q_confirmation_positive = Q(confirmation_result=True)
Q_confirmation_negative = Q(confirmation_result=False)

Q_staging = Q(stage_result__isnull=False)
Q_staging_stage1 = Q(stage_result='stage1')
Q_staging_stage2 = Q(stage_result='stage2')

Q_is_suspect = Q(Q_screening_positive & ~Q_confirmation & ~Q_staging)
