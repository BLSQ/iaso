import { useSafeIntl } from 'bluesquare-components';
import { FormikProps } from 'formik';
import MESSAGES from '../../../constants/messages';
import { CampaignFormValues } from '../../../constants/types';

export const useSubActivityTabTooltip = (
    formik: FormikProps<CampaignFormValues>,
): string => {
    const { formatMessage } = useSafeIntl();
    if (
        formik.values.id &&
        formik.values.separate_scopes_per_round !==
            formik.initialValues.separate_scopes_per_round
    ) {
        return formatMessage(MESSAGES.subActivitiesLockedScopeChange);
    }
    return formatMessage(MESSAGES.subActivitiesUnlockConditions);
};
