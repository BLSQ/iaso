import * as yup from 'yup';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';

export const usePerformanceDashboardSchema = () => {
    const { formatMessage } = useSafeIntl();
    return yup.object().shape({
        date: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
        status: yup
            .string()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
        country_id: yup
            .number()
            .positive()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
        antigen: yup
            .string()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
    });
};
