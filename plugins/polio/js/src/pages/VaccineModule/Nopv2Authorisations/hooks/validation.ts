/* eslint-disable camelcase */
import * as yup from 'yup';
import { useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import MESSAGES from '../../../../constants/messages';

yup.addMethod(
    yup.date,
    'checkDateForExpired',
    function checkDateForExpired(formatMessage) {
        return this.test('checkDateForExpired', '', (value, context) => {
            const { path, createError, parent } = context;
            const now = moment();
            const newExpiryDate = moment(value);
            const { status } = parent;

            let errorMessage;

            if (newExpiryDate?.isAfter(now) && status === 'EXPIRED') {
                errorMessage = formatMessage(MESSAGES.dateForExpired);
            }
            if (errorMessage) {
                return createError({
                    path,
                    message: errorMessage,
                });
            }
            return true;
        });
    },
);

export const useNopv2AuthorisationsSchema = () => {
    const { formatMessage } = useSafeIntl();
    return yup.object().shape({
        expiration_date: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable()
            // ts-compiler doesn't recognize the added method
            // @ts-ignore
            .checkDateForExpired(formatMessage),
        country: yup
            .number()
            .positive()
            .nullable()
            .required(formatMessage(MESSAGES.fieldRequired)),
        quantity: yup.number().positive().nullable(),
        status: yup
            .string()
            .nullable()
            .required(formatMessage(MESSAGES.fieldRequired)),
        comments: yup.string().nullable(),
    });
};
