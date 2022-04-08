import { object, date, string, number, ref, array } from 'yup';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../constants/messages';

// eslint-disable-next-line camelcase
const useRoundShape = () => {
    const { formatMessage } = useSafeIntl();

    return object().shape({
        started_at: date().nullable(),
        ended_at: date()
            .nullable()
            .min(
                ref('started_at'),
                formatMessage(MESSAGES.endDateBeforeStartDate),
            ),
        mop_up_started_at: date().nullable(),
        mop_up_ended_at: date()
            .nullable()
            .min(
                ref('mop_up_started_at'),
                formatMessage(MESSAGES.endDateBeforeStartDate),
            ),
        im_started_at: date().nullable(),
        im_ended_at: date()
            .nullable()
            .min(
                ref('im_started_at'),
                formatMessage(MESSAGES.endDateBeforeStartDate),
            ),
        lqas_started_at: date().nullable(),
        lqas_ended_at: date()
            .nullable()
            .min(
                ref('lqas_started_at'),
                formatMessage(MESSAGES.endDateBeforeStartDate),
            ),
        target_population: number().nullable().min(0).integer(),
        cost: number().nullable().min(0).integer(),
        lqas_district_passing: number()
            .nullable()
            .integer()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveInteger)),
        lqas_district_failing: number()
            .nullable()
            .integer()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveNumber)),
        im_percentage_children_missed_in_household: number()
            .nullable()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveNumber)),
        im_percentage_children_missed_out_household: number()
            .nullable()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveNumber)),
        im_percentage_children_missed_in_plus_out_household: number()
            .nullable()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveNumber)),
        awareness_of_campaign_planning: number()
            .nullable()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveNumber)),
    });
};

export const useFormValidator = () => {
    const { formatMessage } = useSafeIntl();
    // eslint-disable-next-line camelcase
    const round_shape = useRoundShape();

    return object().shape({
        epid: string().nullable(),
        obr_name: string().trim().required(),
        grouped_campaigns: array(string()).nullable(),
        description: string().nullable(),
        onset_at: date().nullable(),
        three_level_call_at: date().nullable(),

        cvdpv_notified_at: date().nullable(),
        cvdpv2_notified_at: date().nullable(),

        pv_notified_at: date().nullable(),
        pv2_notified_at: date().nullable(),

        detection_first_draft_submitted_at: date().nullable(),
        detection_rrt_oprtt_approval_at: date().nullable(),

        investigation_at: date().nullable(),
        risk_assessment_first_draft_submitted_at: date().nullable(),
        risk_assessment_rrt_oprtt_approval_at: date().nullable(),
        ag_nopv_group_met_at: date().nullable(),
        dg_authorized_at: date().nullable(),

        spreadsheet_url: string().url().nullable(),

        eomg: date().nullable(),
        budget_submitted_at: date().nullable(),
        district_count: number()
            .nullable()
            .positive()
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
        no_regret_fund_amount: number()
            .nullable()
            .positive()
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),

        round_one: round_shape,
        round_two: round_shape,
    });
};
