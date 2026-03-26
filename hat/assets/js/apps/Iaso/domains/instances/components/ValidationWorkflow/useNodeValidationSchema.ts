import { useSafeIntl } from 'bluesquare-components';
import * as yup from 'yup';
import MESSAGES from '../../messages';

export const useNodeValidationSchema = () => {
    const { formatMessage } = useSafeIntl();
    return yup.object().shape({
        // TODO force string value
        approved: yup.string().required(formatMessage(MESSAGES.requiredField)),
        comment: yup.string().nullable(),
    });
};
