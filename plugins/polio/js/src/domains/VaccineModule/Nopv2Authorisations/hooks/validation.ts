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

yup.addMethod(
    yup.date,
    'checkDateForStart',
    function checkDateForStart(formatMessage) {
        return this.test('checkDateForStart', '', (value, context) => {
            const { path, createError, parent } = context;
            const startDate = moment(value);
            const { expiration_date } = parent;

            let errorMessage;

            if (startDate?.isAfter(moment(expiration_date))) {
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
            .checkDateForStart(formatMessage),
        expiration_date: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable()
            .required(formatMessage(MESSAGES.fieldRequired))
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
