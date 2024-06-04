import * as yup from 'yup';
import { useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import { useMemo } from 'react';
import { Round } from '../../../../constants/types';
import { dateFormat } from '../../../Calendar/campaignCalendar/constants';
import MESSAGES from '../messages';

yup.addMethod(
    yup.date,
    'validateStartDate',
    function validateStartDate(formatMessage, round) {
        return this.test('validateStartDate', '', (value, context) => {
            const { path, createError, parent } = context;
            const newStartDate = moment(value);
            const endDate =
                parent.end_date && moment(parent.end_date, dateFormat);

            let errorMessage;

            if (endDate?.isSameOrBefore(newStartDate)) {
                errorMessage = formatMessage(MESSAGES.startDateAfterEndDate);
            } else {
                const roundStartDate = moment(round?.started_at, dateFormat);
                const roundEndDate = moment(round?.ended_at, dateFormat);
                if (roundStartDate?.isAfter(newStartDate)) {
                    errorMessage = formatMessage(
                        MESSAGES.startDateBeforeRoundDate,
                    );
                }
                if (roundEndDate?.isSameOrBefore(newStartDate)) {
                    errorMessage = formatMessage(
                        MESSAGES.startDateAfterRoundEnd,
                    );
                }
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
    'validateEndDate',
    function validateEndDate(formatMessage, round) {
        return this.test('validateEndDate', '', (value, context) => {
            const { path, createError, parent } = context;
            const newEndDate = moment(value);
            const startDate =
                parent.start_date && moment(parent.start_date, dateFormat);
            let errorMessage;

            if (startDate?.isSameOrAfter(newEndDate)) {
                errorMessage = formatMessage(MESSAGES.endDateBeforeStartDate);
            } else {
                const roundStartDate = moment(round?.started_at, dateFormat);
                const roundEndDate = moment(round?.ended_at, dateFormat);
                if (roundEndDate?.isBefore(newEndDate)) {
                    errorMessage = formatMessage(
                        MESSAGES.endDateAfterRoundDate,
                    );
                }
                if (roundStartDate.isSameOrAfter(newEndDate)) {
                    errorMessage = formatMessage(
                        MESSAGES.endDateBeforeRoundStart,
                    );
                }
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

export const useSubActivityValidation = (
    round?: Round,
): yup.ObjectSchema<any> => {
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
                    .validateStartDate(formatMessage, round)
                    .required(formatMessage(MESSAGES.fieldRequired)),
                end_date: yup
                    .date()
                    .typeError(formatMessage(MESSAGES.invalidDate))
                    .nullable()
                    // end should be after start
                    // end should not be after round end
                    // @ts-ignore
                    .validateEndDate(formatMessage, round)
                    .required(formatMessage(MESSAGES.fieldRequired)),
                age_unit: yup.string().nullable(),
                age_min: yup.number().nullable(),
                age_max: yup.number().nullable(),
            }),
        [formatMessage, round],
    );
};
