import * as yup from 'yup';
import { number, string } from 'yup';

import { useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../messages';

export const useCreateChronogramSchema = () => {
    const { formatMessage } = useSafeIntl();
    return yup.object().shape({
        country: number()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField))
            .integer()
            .typeError(formatMessage(MESSAGES.requiredPositiveInteger)),
        campaign: string()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField))
            .uuid()
            .typeError(formatMessage(MESSAGES.requiredUuid)),
    });
};
