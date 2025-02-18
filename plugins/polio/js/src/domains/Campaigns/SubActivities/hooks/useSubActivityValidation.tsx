import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import * as yup from 'yup';
import { dateFormat } from '../../../Calendar/campaignCalendar/constants';
import MESSAGES from '../messages';

const dateKeys = {
    activity: { start: 'start_date', end: 'end_date' },
    lqas: { start: 'lqas_started_at', end: 'lqas_ended_at' },
    im: { start: 'im_started_at', end: 'im_ended_at' },
};

const formatRoundErrorMessage = ({
    initialMessage,
    roundDate,
    formDate,
    errorMsg,
}): string => {
    // Rounds cannot have empty start date so no need to null check it
    const roundStartDate = moment(roundDate, dateFormat);
    if (roundStartDate.isAfter(formDate)) {
        if (!initialMessage) {
            return errorMsg;
        }
        return `${initialMessage}. ${errorMsg}`;
    }
    return initialMessage;
};

yup.addMethod(
    yup.date,
    'validateStartDate',
    function validateStartDate(formatMessage) {
        return this.test('validateStartDate', '', (value, context) => {
            const keys = dateKeys.activity;
            const { path, createError, parent } = context;
            const newStartDate = moment(value);

            const endDate =
                parent[keys.end] && moment(parent[keys.end], dateFormat);

            let errorMessage;

            if (endDate?.isBefore(newStartDate)) {
                errorMessage = formatMessage(MESSAGES.startDateAfterEndDate);
            }
            errorMessage = formatRoundErrorMessage({
                initialMessage: errorMessage,
                roundDate: parent.round_start_date,
                formDate: newStartDate,
                errorMsg: formatMessage(MESSAGES.mustBeAfterRoundStartDate),
            });

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
    'validateLqasImStartDate',
    function validateLqasImStartDate(formatMessage, dateType) {
        return this.test('validateLqasImStartDate', '', (value, context) => {
            const keys = dateKeys[dateType];
            const { path, createError, parent } = context;
            if (!value) {
                return true;
            }
            const activityHasEndDate = Boolean(parent.end_date);

            const newStartDate = moment(value);
            const endDate =
                parent[keys.end] && moment(parent[keys.end], dateFormat);

            let errorMessage = '';

            if (endDate?.isBefore(newStartDate)) {
                errorMessage = formatMessage(MESSAGES.endDateBeforeStartDate);
            }
            if (activityHasEndDate) {
                const activityEndDate = moment(parent.end_date, dateFormat);
                if (endDate?.isSameOrBefore(activityEndDate)) {
                    if (errorMessage) {
                        errorMessage = formatMessage(
                            MESSAGES.mustBeAfterSubActivityEndDate,
                        );
                    } else {
                        errorMessage = `${errorMessage}
                        ${formatMessage(MESSAGES.mustBeAfterSubActivityEndDate)}`;
                    }
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
    'validateLqasImEndDate',
    function validateLqasImEndDate(formatMessage, dateType) {
        return this.test('validateLqasImEndDate', '', (value, context) => {
            const keys = dateKeys[dateType];
            const { path, createError, parent } = context;
            if (!value) {
                return true;
            }
            const activityHasEndDate = Boolean(parent.end_date);
            const newEndDate = moment(value);
            const startDate =
                parent[keys.start] && moment(parent[keys.start], dateFormat);

            let errorMessage;

            if (startDate?.isAfter(newEndDate)) {
                errorMessage = formatMessage(MESSAGES.startDateAfterEndDate);
            }
            if (activityHasEndDate) {
                const activityEndDate = moment(parent.end_date, dateFormat);
                // We compare to the activity end date because LQAs/IM should start after the round ends
                if (startDate?.isSameOrBefore(activityEndDate)) {
                    if (errorMessage) {
                        errorMessage = formatMessage(
                            MESSAGES.mustBeAfterSubActivityEndDate,
                        );
                    } else {
                        errorMessage = `${errorMessage}
                        ${formatMessage(MESSAGES.mustBeAfterSubActivityEndDate)}`;
                    }
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
    // Add round to args and uncomment code to enable restriction based on round dates
    function validateEndDate(formatMessage) {
        return this.test('validateEndDate', '', (value, context) => {
            const keys = dateKeys.activity;
            const { path, createError, parent } = context;
            const newEndDate = moment(value);
            const startDate =
                parent[keys.start] && moment(parent[keys.start], dateFormat);
            let errorMessage;

            if (startDate?.isAfter(newEndDate)) {
                errorMessage = formatMessage(MESSAGES.endDateBeforeStartDate);
            }
            errorMessage = formatRoundErrorMessage({
                initialMessage: errorMessage,
                roundDate: parent.round_start_date,
                formDate: newEndDate,
                errorMsg: formatMessage(MESSAGES.mustBeAfterRoundStartDate),
            });

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
                lqas_started_at: yup
                    .date()
                    .typeError(formatMessage(MESSAGES.invalidDate))
                    .nullable()
                    // start should be before end
                    // start should not be before round start
                    // @ts-ignore
                    // lqas/im cannot start before the round/subactivity has ended
                    .validateLqasImStartDate(formatMessage, 'lqas'),
                lqas_ended_at: yup
                    .date()
                    .typeError(formatMessage(MESSAGES.invalidDate))
                    .nullable()
                    // end should be after start
                    // end should not be after round end
                    // @ts-ignore
                    .validateLqasImEndDate(formatMessage, 'lqas'),
                im_started_at: yup
                    .date()
                    .typeError(formatMessage(MESSAGES.invalidDate))
                    .nullable()
                    // start should be before end
                    // start should not be before round start
                    // lqas/im cannot start before the round/subactivity has ended
                    // @ts-ignore
                    .validateLqasImStartDate(formatMessage, 'im'),
                im_ended_at: yup
                    .date()
                    .typeError(formatMessage(MESSAGES.invalidDate))
                    .nullable()
                    // end should be after start
                    // end should not be after round end
                    // @ts-ignore
                    .validateLqasImEndDate(formatMessage, 'im'),
                age_unit: yup.string().nullable(),
                age_min: yup.number().nullable(),
                age_max: yup.number().nullable(),
            }),
        [formatMessage],
    );
};
