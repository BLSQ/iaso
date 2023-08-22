/* eslint-disable camelcase */
import * as yup from 'yup';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../../constants/messages';

export const useNopv2AuthorisationsSchema = () => {
    const { formatMessage } = useSafeIntl();
    return yup.object().shape({
        expiration_date: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        quantity: yup.number().positive().nullable(),
        status: yup
            .string()
            .nullable()
            .required(formatMessage(MESSAGES.fieldRequired)),
        comments: yup.string().nullable(),
    });
};
