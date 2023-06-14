/* eslint-disable camelcase */
import * as yup from 'yup';
import moment from 'moment';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../constants/messages';
import { dateFormat } from '../../campaignCalendar/constants';
import { Round } from '../../../constants/types';

yup.addMethod(
    yup.date,
    'isStartBeforeEnd',
    function isStartBeforeEnd(formatMessage, parentRoundData, currentRound) {
        return this.test('isStartBeforeEnd', '', (value, context) => {
            const { path, createError, parent } = context;
            const { number: currentRoundNumber } = currentRound;
            const newStartDate = moment(value);
            const endDate =
                parent.endDate && moment(parent.endDate, dateFormat);
            const previousRound = parentRoundData.find(
                r => r.number === currentRoundNumber - 1,
            );

            let errorMessage;

            if (endDate?.isSameOrBefore(newStartDate)) {
                errorMessage = formatMessage(MESSAGES.startDateAfterEndDate);
            } else if (previousRound) {
                const previousEndDate = moment(
                    previousRound.ended_at,
                    dateFormat,
                );
                if (previousEndDate?.isSameOrAfter(newStartDate)) {
                    errorMessage = formatMessage(
                        MESSAGES.startDateBeforePreviousEndDate,
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
    'isEndBeforeStart',
    function isEndBeforeStart(formatMessage, parentRoundData, currentRound) {
        return this.test('isEndBeforeStart', '', (value, context) => {
            const { path, createError, parent } = context;
            const newEndDate = moment(value);
            const { number: currentRoundNumber } = currentRound;
            const startDate =
                parent.startDate && moment(parent.startDate, dateFormat);
            const nextRound = parentRoundData.find(
                r => r.number === currentRoundNumber - 1,
            );
            let errorMessage;

            if (startDate?.isSameOrAfter(newEndDate)) {
                errorMessage = formatMessage(MESSAGES.endDateBeforeStartDate);
            } else if (nextRound) {
                const nextEndDate = moment(nextRound.ended_at, dateFormat);
                if (nextEndDate?.isSameOrBefore(newEndDate)) {
                    errorMessage = formatMessage(
                        MESSAGES.endDateAfterNextStartDate,
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

export const useRoundDateHistorySchema = (
    parentRoundData: Round[],
    currentRound: Round,
) => {
    const { formatMessage } = useSafeIntl();
    return yup.object().shape({
        startDate: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable()
            .required(formatMessage(MESSAGES.fieldRequired))
            // @ts-ignore
            .isStartBeforeEnd(formatMessage, parentRoundData, currentRound),
        endDate: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable()
            .required(formatMessage(MESSAGES.fieldRequired)),
        // @ts-ignore
        // .isEndBeforeStart(formatMessage),
        reason: yup
            .string()
            .nullable()
            .required(formatMessage(MESSAGES.fieldRequired)),
    });
};
