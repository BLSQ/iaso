import { ObjectSchema, array, number, object, string } from 'yup';

import { useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../messages';

export const useCreateBudgetProcessSchema = (): ObjectSchema<any> => {
    const { formatMessage } = useSafeIntl();
    return object().shape({
        country: number()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField))
            .integer()
            .typeError(formatMessage(MESSAGES.requiredPositiveInteger)),
        campaign: string()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField))
            .uuid()
            .typeError(formatMessage(MESSAGES.requiredUuid)),
        rounds: array()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
    });
};
export const useEditBudgetProcessSchema = (): ObjectSchema<any> => {
    const { formatMessage } = useSafeIntl();
    return object().shape({
        rounds: array()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
        payment_mode: string().nullable().optional(),
        district_count: number().nullable().optional(),
        no_regret_fund_amount: number().nullable().optional(),
        ra_completed_at_WFEDITABLE: string()
            .nullable()
            .optional()
            .matches(
                /^\d{4}-\d{2}-\d{2}$/,
                formatMessage(MESSAGES.invalidDate),
            ),
        who_sent_budget_at_WFEDITABLE: string()
            .nullable()
            .optional()
            .matches(
                /^\d{4}-\d{2}-\d{2}$/,
                formatMessage(MESSAGES.invalidDate),
            ),
        unicef_sent_budget_at_WFEDITABLE: string()
            .nullable()
            .optional()
            .matches(
                /^\d{4}-\d{2}-\d{2}$/,
                formatMessage(MESSAGES.invalidDate),
            ),
        gpei_consolidated_budgets_at_WFEDITABLE: string()
            .nullable()
            .optional()
            .matches(
                /^\d{4}-\d{2}-\d{2}$/,
                formatMessage(MESSAGES.invalidDate),
            ),
        submitted_to_rrt_at_WFEDITABLE: string()
            .nullable()
            .optional()
            .matches(
                /^\d{4}-\d{2}-\d{2}$/,
                formatMessage(MESSAGES.invalidDate),
            ),
        feedback_sent_to_gpei_at_WFEDITABLE: string()
            .nullable()
            .optional()
            .matches(
                /^\d{4}-\d{2}-\d{2}$/,
                formatMessage(MESSAGES.invalidDate),
            ),
        re_submitted_to_rrt_at_WFEDITABLE: string()
            .nullable()
            .optional()
            .matches(
                /^\d{4}-\d{2}-\d{2}$/,
                formatMessage(MESSAGES.invalidDate),
            ),
        submitted_to_orpg_operations1_at_WFEDITABLE: string()
            .nullable()
            .optional()
            .matches(
                /^\d{4}-\d{2}-\d{2}$/,
                formatMessage(MESSAGES.invalidDate),
            ),
        feedback_sent_to_rrt1_at_WFEDITABLE: string()
            .nullable()
            .optional()
            .matches(
                /^\d{4}-\d{2}-\d{2}$/,
                formatMessage(MESSAGES.invalidDate),
            ),
        re_submitted_to_orpg_operations1_at_WFEDITABLE: string()
            .nullable()
            .optional()
            .matches(
                /^\d{4}-\d{2}-\d{2}$/,
                formatMessage(MESSAGES.invalidDate),
            ),
        submitted_to_orpg_wider_at_WFEDITABLE: string()
            .nullable()
            .optional()
            .matches(
                /^\d{4}-\d{2}-\d{2}$/,
                formatMessage(MESSAGES.invalidDate),
            ),
        submitted_to_orpg_operations2_at_WFEDITABLE: string()
            .nullable()
            .optional()
            .matches(
                /^\d{4}-\d{2}-\d{2}$/,
                formatMessage(MESSAGES.invalidDate),
            ),
        feedback_sent_to_rrt2_at_WFEDITABLE: string()
            .nullable()
            .optional()
            .matches(
                /^\d{4}-\d{2}-\d{2}$/,
                formatMessage(MESSAGES.invalidDate),
            ),
        re_submitted_to_orpg_operations2_at_WFEDITABLE: string()
            .nullable()
            .optional()
            .matches(
                /^\d{4}-\d{2}-\d{2}$/,
                formatMessage(MESSAGES.invalidDate),
            ),
        submitted_for_approval_at_WFEDITABLE: string()
            .nullable()
            .optional()
            .matches(
                /^\d{4}-\d{2}-\d{2}$/,
                formatMessage(MESSAGES.invalidDate),
            ),
        feedback_sent_to_orpg_operations_unicef_at_WFEDITABLE: string()
            .nullable()
            .optional()
            .matches(
                /^\d{4}-\d{2}-\d{2}$/,
                formatMessage(MESSAGES.invalidDate),
            ),
        feedback_sent_to_orpg_operations_who_at_WFEDITABLE: string()
            .nullable()
            .optional()
            .matches(
                /^\d{4}-\d{2}-\d{2}$/,
                formatMessage(MESSAGES.invalidDate),
            ),
        approved_by_who_at_WFEDITABLE: string()
            .nullable()
            .optional()
            .matches(
                /^\d{4}-\d{2}-\d{2}$/,
                formatMessage(MESSAGES.invalidDate),
            ),
        approved_by_unicef_at_WFEDITABLE: string()
            .nullable()
            .optional()
            .matches(
                /^\d{4}-\d{2}-\d{2}$/,
                formatMessage(MESSAGES.invalidDate),
            ),
        approved_at_WFEDITABLE: string()
            .nullable()
            .optional()
            .matches(
                /^\d{4}-\d{2}-\d{2}$/,
                formatMessage(MESSAGES.invalidDate),
            ),
        approval_confirmed_at_WFEDITABLE: string()
            .nullable()
            .optional()
            .matches(
                /^\d{4}-\d{2}-\d{2}$/,
                formatMessage(MESSAGES.invalidDate),
            ),
        who_disbursed_to_co_at: string()
            .nullable()
            .optional()
            .matches(
                /^\d{4}-\d{2}-\d{2}$/,
                formatMessage(MESSAGES.invalidDate),
            ),
        who_disbursed_to_moh_at: string()
            .nullable()
            .optional()
            .matches(
                /^\d{4}-\d{2}-\d{2}$/,
                formatMessage(MESSAGES.invalidDate),
            ),
        unicef_disbursed_to_co_at: string()
            .nullable()
            .optional()
            .matches(
                /^\d{4}-\d{2}-\d{2}$/,
                formatMessage(MESSAGES.invalidDate),
            ),
        unicef_disbursed_to_moh_at: string()
            .nullable()
            .optional()
            .matches(
                /^\d{4}-\d{2}-\d{2}$/,
                formatMessage(MESSAGES.invalidDate),
            ),
    });
};
