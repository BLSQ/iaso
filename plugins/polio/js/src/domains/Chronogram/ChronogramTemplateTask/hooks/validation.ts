import * as yup from 'yup';

import { useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../messages';

export const useChronogramTemplateTaskSchema = () => {
    const { formatMessage } = useSafeIntl();
    return yup.object().shape({
        period: yup
            .string()
            .trim()
            .required(formatMessage(MESSAGES.validationFieldRequired)),
        description: yup
            .string()
            .trim()
            .required(formatMessage(MESSAGES.validationFieldRequired)),
        start_offset_in_days: yup
            .number()
            .required(formatMessage(MESSAGES.validationFieldRequired)),
    });
};
