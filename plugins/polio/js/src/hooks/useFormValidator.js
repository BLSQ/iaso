import * as yup from 'yup';
import moment from 'moment';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../constants/messages';
import { dateFormat } from '../components/campaignCalendar/constants';

const getRounds = context => {
    return context?.from[context.from.length - 1]?.value?.rounds || [];
};

yup.addMethod(
    yup.date,
    'isValidRoundStartDate',
    function isValidRoundStartDate(formatMessage) {
        return this.test('isValidRoundStartDate', '', (value, context) => {
            const rounds = getRounds(context);
            const { path, createError, parent } = context;
            const newStartDate = moment(value);
            const endDate =
                parent.ended_at && moment(parent.ended_at, dateFormat);
            const previousNumber = parent.number - 1;

            let errorMessage;

            if (endDate?.isSameOrBefore(newStartDate)) {
                errorMessage = formatMessage(MESSAGES.startDateAfterEndDate);
            } else if (previousNumber >= 0) {
                const previousRound = rounds.find(
                    r => r.number === previousNumber,
                );
                if (previousRound) {
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
    'isValidRoundEndDate',
    function isValidRoundEndDate(formatMessage) {
        return this.test('isValidRoundEndDate', '', (value, context) => {
            const rounds = getRounds(context);
            const { path, createError, parent } = context;
            const newEndDate = moment(value);
            const nextNumber = parent.number + 1;
            const startDate =
                parent.started_at && moment(parent.started_at, dateFormat);

            let errorMessage;

            if (startDate?.isSameOrAfter(newEndDate)) {
                errorMessage = formatMessage(MESSAGES.endDateBeforeStartDate);
            } else if (newEndDate.isValid() && nextNumber >= 0) {
                const nextRound = rounds.find(r => r.number === nextNumber);
                if (nextRound) {
                    const nextEndDate = moment(nextRound.ended_at, dateFormat);
                    if (nextEndDate?.isSameOrBefore(newEndDate)) {
                        errorMessage = formatMessage(
                            MESSAGES.endDateAfterNextStartDate,
                        );
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

// eslint-disable-next-line camelcase
const useRoundShape = () => {
    const { formatMessage } = useSafeIntl();

    return yup.object().shape({
        number: yup.number().integer().min(0),
        started_at: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable()
            .required(formatMessage(MESSAGES.fieldRequired))
            .isValidRoundStartDate(formatMessage),
        ended_at: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable()
            .required(formatMessage(MESSAGES.fieldRequired))
            .isValidRoundEndDate(formatMessage),
        mop_up_started_at: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        mop_up_ended_at: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable()
            .min(
                yup.ref('mop_up_started_at'),
                formatMessage(MESSAGES.endDateBeforeStartDate),
            ),
        im_started_at: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        im_ended_at: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable()
            .min(
                yup.ref('im_started_at'),
                formatMessage(MESSAGES.endDateBeforeStartDate),
            ),
        lqas_started_at: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        lqas_ended_at: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable()
            .min(
                yup.ref('lqas_started_at'),
                formatMessage(MESSAGES.endDateBeforeStartDate),
            ),
        target_population: yup.number().nullable().min(0).integer(),
        cost: yup.number().nullable().min(0).integer(),
        lqas_district_passing: yup
            .number()
            .nullable()
            .integer()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveInteger)),
        lqas_district_failing: yup
            .number()
            .nullable()
            .integer()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveNumber)),
        im_percentage_children_missed_in_household: yup
            .number()
            .nullable()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveNumber)),
        im_percentage_children_missed_out_household: yup
            .number()
            .nullable()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveNumber)),
        im_percentage_children_missed_in_plus_out_household: yup
            .number()
            .nullable()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveNumber)),
        awareness_of_campaign_planning: yup
            .number()
            .nullable()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveNumber)),
    });
};

export const useFormValidator = () => {
    const { formatMessage } = useSafeIntl();
    // eslint-disable-next-line camelcase
    const round_shape = useRoundShape();

    return yup.object().shape({
        epid: yup.string().nullable(),
        obr_name: yup.string().trim().required(),
        grouped_campaigns: yup.array(yup.number()).nullable(),
        description: yup.string().nullable(),
        onset_at: yup.date().nullable(),
        three_level_call_at: yup.date().nullable(),

        cvdpv_notified_at: yup.date().nullable(),
        cvdpv2_notified_at: yup.date().nullable(),

        pv_notified_at: yup.date().nullable(),
        pv2_notified_at: yup.date().nullable(),

        detection_first_draft_submitted_at: yup.date().nullable(),
        detection_rrt_oprtt_approval_at: yup.date().nullable(),

        investigation_at: yup.date().nullable(),
        risk_assessment_first_draft_submitted_at: yup.date().nullable(),
        risk_assessment_rrt_oprtt_approval_at: yup.date().nullable(),
        ag_nopv_group_met_at: yup.date().nullable(),
        dg_authorized_at: yup.date().nullable(),

        spreadsheet_url: yup.string().url().nullable(),

        eomg: yup.date().nullable(),
        budget_submitted_at: yup.date().nullable(),
        district_count: yup
            .number()
            .nullable()
            .positive()
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
        no_regret_fund_amount: yup
            .number()
            .nullable()
            .positive()
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
        rounds: yup.array(round_shape).nullable(),
    });
};
