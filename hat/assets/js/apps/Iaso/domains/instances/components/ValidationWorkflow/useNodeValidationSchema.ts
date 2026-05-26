import { useSafeIntl } from 'bluesquare-components';
import * as yup from 'yup';
import MESSAGES from '../../messages';

export const useNodeValidationApproveSchema = () => {
    return yup.object().shape({
        comment: yup.string().nullable(),
    });
};

export const useNodeValidationRejectSchema = () => {
    const { formatMessage } = useSafeIntl();
    return yup.object().shape({
        comment: yup.string().required(formatMessage(MESSAGES.requiredField)),
    });
};
