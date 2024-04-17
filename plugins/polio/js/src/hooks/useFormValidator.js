/* eslint-disable camelcase */
import { useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import * as yup from 'yup';
import MESSAGES from '../constants/messages';
import { dateFormat } from '../domains/Calendar/campaignCalendar/constants.ts';

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

yup.addMethod(yup.date, 'isValidOnset', function isValidOnset(formatMessage) {
    return this.test('insValidOnset', '', (value, context) => {
        const { path, createError, parent } = context;
        const newDate = value ? moment(value) : null;
        const today = moment().endOf('day');

        if (newDate === null) return true;
        if (newDate.isAfter(today)) {
            return createError({
                path,
                message: formatMessage(MESSAGES.futureDateError),
            });
        }
        const virusNotification = parent.cvdpv2_notified_at
            ? moment(parent.cvdpv2_notified_at)
            : null;
        if (virusNotification && newDate.isAfter(virusNotification)) {
            return createError({
                path,
                message: formatMessage(MESSAGES.onsetAfterNotificationError),
            });
        }
        const outbreakDeclaration = parent.outbreak_declaration_date
            ? moment(parent.outbreak_declaration_date)
            : null;

        if (outbreakDeclaration && newDate.isAfter(outbreakDeclaration)) {
            return createError({
                path,
                message: formatMessage(
                    MESSAGES.onsetAfterOutbreakDeclarationError,
                ),
            });
        }
        return true;
    });
});
yup.addMethod(
    yup.date,
    'isValidVirusNotification',
    function isValidVirusNotification(formatMessage) {
        return this.test('isValidVirusNotification', '', (value, context) => {
            const { path, createError, parent } = context;
            const newDate = value ? moment(value) : null;
            const today = moment().endOf('day');

            if (newDate === null) return true;
            if (newDate.isAfter(today)) {
                return createError({
                    path,
                    message: formatMessage(MESSAGES.futureDateError),
                });
            }
            const onset = parent.onset_at ? moment(parent.onset_at) : null;
            if (onset && newDate.isBefore(onset)) {
                return createError({
                    path,
                    message: formatMessage(
                        MESSAGES.onsetAfterNotificationError,
                    ),
                });
            }

            const outbreakDeclaration = parent.outbreak_declaration_date
                ? moment(parent.outbreak_declaration_date)
                : null;

            if (outbreakDeclaration && newDate.isAfter(outbreakDeclaration)) {
                return createError({
                    path,
                    message: formatMessage(
                        MESSAGES.virusNotificationAfterOutbreakDeclarationError,
                    ),
                });
            }
            return true;
        });
    },
);
yup.addMethod(
    yup.date,
    'isValidOutbreakDeclaration',
    function isValidOutbreakDeclaration(formatMessage) {
        return this.test('isValidOutbreakDeclaration', '', (value, context) => {
            const { path, createError, parent } = context;
            const newDate = value ? moment(value) : null;
            const today = moment().endOf('day');

            if (newDate === null) return true;
            if (newDate.isAfter(today)) {
                return createError({
                    path,
                    message: formatMessage(MESSAGES.futureDateError),
                });
            }
            const onset = parent.onset_at ? moment(parent.onset_at) : null;
            if (onset && newDate.isBefore(onset)) {
                return createError({
                    path,
                    message: formatMessage(
                        MESSAGES.onsetAfterOutbreakDeclarationError,
                    ),
                });
            }
            const virusNotification = parent.cvdpv2_notified_at
                ? moment(parent.cvdpv2_notified_at)
                : null;
            if (virusNotification && newDate.isBefore(virusNotification)) {
                return createError({
                    path,
                    message: formatMessage(
                        MESSAGES.virusNotificationAfterOutbreakDeclarationError,
                    ),
                });
            }
            return true;
        });
    },
);

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
        target_population: yup
            .number()
            .nullable()
            .min(0, formatMessage(MESSAGES.positiveInteger))
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
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
        percentage_covered_target_population: yup
            .number()
            .nullable()
            .integer()
            .min(0, formatMessage(MESSAGES.positiveRangeInteger))
            .max(100, formatMessage(MESSAGES.positiveRangeInteger))
            .typeError(formatMessage(MESSAGES.positiveInteger)),
    });
};

export const useFormValidator = () => {
    const { formatMessage } = useSafeIntl();
    // eslint-disable-next-line camelcase
    const round_shape = useRoundShape();

    const polioSchema = {
        virus: yup
            .string()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
        vaccines: yup.string().nullable(),
        epid: yup.string().nullable(),
        grouped_campaigns: yup.array(yup.number()).nullable(),
        onset_at: yup
            .date()
            .nullable()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .isValidOnset(formatMessage),
        cvdpv2_notified_at: yup
            .date()
            .nullable()
            .isValidVirusNotification(formatMessage),
        outbreak_declaration_date: yup
            .date()
            .nullable()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .isValidOutbreakDeclaration(formatMessage),

        detection_first_draft_submitted_at: yup.date().nullable(),
        detection_rrt_oprtt_approval_at: yup.date().nullable(),

        investigation_at: yup
            .date()
            .nullable()
            .typeError(formatMessage(MESSAGES.invalidDate)),
        risk_assessment_first_draft_submitted_at: yup
            .date()
            .nullable()
            .typeError(formatMessage(MESSAGES.invalidDate)),
        risk_assessment_rrt_oprtt_approval_at: yup
            .date()
            .nullable()
            .typeError(formatMessage(MESSAGES.invalidDate)),
        ag_nopv_group_met_at: yup
            .date()
            .nullable()
            .typeError(formatMessage(MESSAGES.invalidDate)),
        dg_authorized_at: yup
            .date()
            .nullable()
            .typeError(formatMessage(MESSAGES.invalidDate)),
        // Budget tab
        who_sent_budget_at_WFEDITABLE: yup.date().nullable(),
        unicef_sent_budget_at_WFEDITABLE: yup.date().nullable(),
        gpei_consolidated_budgets_at_WFEDITABLE: yup.date().nullable(),
        submitted_to_rrt_at_WFEDITABLE: yup.date().nullable(),
        feedback_sent_to_gpei_at_WFEDITABLE: yup.date().nullable(),
        re_submitted_to_rrt_at_WFEDITABLE: yup.date().nullable(),
        submitted_to_orpg_operations1_at_WFEDITABLE: yup.date().nullable(),
        feedback_sent_to_rrt1_at_WFEDITABLE: yup.date().nullable(),
        submitted_to_orpg_wider_at_WFEDITABLE: yup.date().nullable(),
        submission_to_orpg_operations_2_at_WFEDITABLE: yup.date().nullable(),
        feedback_sent_to_rrt2_at_WFEDITABLE: yup.date().nullable(),
        re_submitted_to_orpg_operations1_at_WFEDITABLE: yup.date().nullable(),
        re_submitted_to_orpg_operations2_at_WFEDITABLE: yup.date().nullable(),
        submitted_for_approval_at_WFEDITABLE: yup.date().nullable(),
        approved_by_who_at_WFEDITABLE: yup.date().nullable(),
        feedback_sent_to_orpg_operations_who_at_WFEDITABLE: yup
            .date()
            .nullable(),
        feedback_sent_to_orpg_operations_unicef_at_WFEDITABLE: yup
            .date()
            .nullable(),
        approved_by_unicef_at_WFEDITABLE: yup.date().nullable(),
        approved_at_WFEDITABLE: yup.date().nullable(),
        approval_confirmed_at_WFEDITABLE: yup.date().nullable(),
        unicef_disbursed_to_moh_at: yup.date().nullable(),
        unicef_disbursed_to_co_at: yup.date().nullable(),
        who_disbursed_to_moh_at: yup.date().nullable(),
        who_disbursed_to_co_at: yup.date().nullable(),
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
        verification_score: yup.number().nullable().positive().integer(),
    };

    const plainSchema = {
        campaign_types: yup
            .array(yup.number())
            .min(1, formatMessage(MESSAGES.fieldRequired)),
        initial_org_unit: yup
            .number()
            .positive()
            .integer()
            .required(formatMessage(MESSAGES.requiredField)),
        obr_name: yup
            .string()
            .trim()
            .required(formatMessage(MESSAGES.requiredField)),
        description: yup.string().nullable(),
        gpei_coordinator: yup.string().nullable(),
        is_preventive: yup.bool(),
        is_test: yup.bool(),
        rounds: yup.array(round_shape).nullable(),
    };
    return {
        polioSchema: yup.object().shape({
            ...plainSchema,
            ...polioSchema,
        }),
        plainSchema: yup.object().shape(plainSchema),
    };
};
