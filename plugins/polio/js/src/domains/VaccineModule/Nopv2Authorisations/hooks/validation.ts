/* eslint-disable camelcase */
import * as yup from 'yup';
import { useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import MESSAGES from '../../../../constants/messages';

yup.addMethod(
    yup.date,
    'checkForDateValidity',
    function checkForDateValidity(formatMessage) {
        return this.test('checkForDateValidity', '', (value, context) => {
            const { path, createError, parent } = context;
            const now = moment();
            const newExpiryDate = moment(value);
            const startDate = moment(parent.start_date);
            const { status } = parent;
            let errorMessage;

            if (newExpiryDate?.isAfter(now) && status === 'EXPIRED') {
                errorMessage = formatMessage(MESSAGES.dateForExpired);
            }
            if (startDate?.isAfter(moment(newExpiryDate))) {
                errorMessage = formatMessage(MESSAGES.startDateAfterExpiration);
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
        start_date: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable()
            .required(formatMessage(MESSAGES.fieldRequired))
            // @ts-ignore
            .checkForDateValidity(formatMessage),
        expiration_date: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable()
            .required(formatMessage(MESSAGES.fieldRequired))
            // ts-compiler doesn't recognize the added method
            // @ts-ignore
            .checkForDateValidity(formatMessage),
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
