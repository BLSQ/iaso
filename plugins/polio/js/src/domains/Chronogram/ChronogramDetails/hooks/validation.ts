import * as yup from 'yup';

import { useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../messages';

export const useChronogramTaskSchema = () => {
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
            .integer()
            .required(formatMessage(MESSAGES.validationFieldRequired)),
        status: yup
            .string()
            .trim()
            .required(formatMessage(MESSAGES.validationFieldRequired)),
        user_in_charge: yup.number(),
        comment: yup.string().trim(),
    });
};
