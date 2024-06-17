import * as yup from 'yup';
import { useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import { useMemo } from 'react';
import { dateFormat } from '../../../Calendar/campaignCalendar/constants';
import MESSAGES from '../messages';

yup.addMethod(
    yup.date,
    'validateStartDate',
    // Add round to args and uncomment code to enable restriction based on round dates
    function validateStartDate(formatMessage) {
        return this.test('validateStartDate', '', (value, context) => {
            const { path, createError, parent } = context;
            const newStartDate = moment(value);
            const endDate =
                parent.end_date && moment(parent.end_date, dateFormat);

            let errorMessage;

            if (endDate?.isBefore(newStartDate)) {
                errorMessage = formatMessage(MESSAGES.startDateAfterEndDate);
            }
            // Uncomment to allow restriction of dates based on round dates
            // else {
            //     const roundStartDate = moment(round?.started_at, dateFormat);
            //     const roundEndDate = moment(round?.ended_at, dateFormat);
            //     if (roundStartDate?.isAfter(newStartDate)) {
            //         errorMessage = formatMessage(
            //             MESSAGES.startDateBeforeRoundDate,
            //         );
            //     }
            //     if (roundEndDate?.isSameOrBefore(newStartDate)) {
            //         errorMessage = formatMessage(
            //             MESSAGES.startDateAfterRoundEnd,
            //         );
            //     }
            // }
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
    'validateEndDate',
    // Add round to args and uncomment code to enable restriction based on round dates
    function validateEndDate(formatMessage) {
        return this.test('validateEndDate', '', (value, context) => {
            const { path, createError, parent } = context;
            const newEndDate = moment(value);
            const startDate =
                parent.start_date && moment(parent.start_date, dateFormat);
            let errorMessage;

            if (startDate?.isAfter(newEndDate)) {
                errorMessage = formatMessage(MESSAGES.endDateBeforeStartDate);
            }
            // Uncomment to restrict dates based on round dates
            // else {
            //     const roundStartDate = moment(round?.started_at, dateFormat);
            //     const roundEndDate = moment(round?.ended_at, dateFormat);
            //     if (roundEndDate?.isBefore(newEndDate)) {
            //         errorMessage = formatMessage(
            //             MESSAGES.endDateAfterRoundDate,
            //         );
            //     }
            //     if (roundStartDate.isSameOrAfter(newEndDate)) {
            //         errorMessage = formatMessage(
            //             MESSAGES.endDateBeforeRoundStart,
            //         );
            //     }
            // }

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

export const useSubActivityValidation = (): yup.ObjectSchema<any> => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () =>
            yup.object().shape({
                name: yup
                    .string()
                    .nullable()
                    .required(formatMessage(MESSAGES.fieldRequired)),
                start_date: yup
                    .date()
                    .typeError(formatMessage(MESSAGES.invalidDate))
                    .nullable()
                    // start should be before end
                    // start should not be before round start
                    // @ts-ignore
                    .validateStartDate(formatMessage)
                    .required(formatMessage(MESSAGES.fieldRequired)),
                end_date: yup
                    .date()
                    .typeError(formatMessage(MESSAGES.invalidDate))
                    .nullable()
                    // end should be after start
                    // end should not be after round end
                    // @ts-ignore
                    .validateEndDate(formatMessage)
                    .required(formatMessage(MESSAGES.fieldRequired)),
                age_unit: yup.string().nullable(),
                age_min: yup.number().nullable(),
                age_max: yup.number().nullable(),
            }),
        [formatMessage],
    );
};
