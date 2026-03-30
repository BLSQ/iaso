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
        color: yup.string().nullable(),
        description: yup.string().nullable(),
        can_skip_previous_nodes: yup.boolean().nullable(),
        roles_required: yup
            .array()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
    });
};
