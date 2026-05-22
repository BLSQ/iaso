import * as yup from 'yup';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';

export const usePerformanceThresholdValidation = () => {
    const { formatMessage } = useSafeIntl();
    return yup.object().shape({
        indicator: yup
            .string()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
        success_threshold: yup
            .object()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
        warning_threshold: yup
            .object()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
        fail_threshold: yup
            .object()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
    });
};
