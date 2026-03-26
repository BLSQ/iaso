import { useSafeIntl } from 'bluesquare-components';
import * as yup from 'yup';
import MESSAGES from '../../../messages';

export const useNodeValidation = () => {
    const { formatMessage } = useSafeIntl();
    return yup.object().shape({
        name: yup
            .string()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
        color: yup
            .string()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
        description: yup.string().nullable(),
        canSkipPreviousNodes: yup.boolean().nullable(),
        rolesRequired: yup
            .array()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
    });
};
