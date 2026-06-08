import { useSafeIntl } from 'bluesquare-components';
import * as yup from 'yup';

import MESSAGES from '../messages';

export const useChronogramTemplateTaskSchema = () => {
    const { formatMessage } = useSafeIntl();
    return yup.object().shape({
        period: yup
            .string()
            .trim()
            .required(formatMessage(MESSAGES.validationFieldRequired)),
        description_en: yup
            .string()
            .trim()
            .required(formatMessage(MESSAGES.validationFieldRequired)),
        description_fr: yup.string().trim(),
        start_offset_in_days: yup
            .number()
            .required(formatMessage(MESSAGES.validationFieldRequired)),
    });
};
