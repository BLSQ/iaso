/* eslint-disable camelcase */
import * as yup from 'yup';

import { useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../messages';

export const useNotificationSchema = () => {
    const { formatMessage } = useSafeIntl();
    return yup.object().shape({
        country: yup
            .number()
            .required(formatMessage(MESSAGES.requiredField))
            .integer()
            .typeError(formatMessage(MESSAGES.requiredPositiveInteger)),
        campaign: yup
            .string()
            .required(formatMessage(MESSAGES.requiredField))
            .uuid()
            .typeError(formatMessage(MESSAGES.requiredUuid)),
        rounds: yup.string().required(formatMessage(MESSAGES.requiredField)),
    });
};
