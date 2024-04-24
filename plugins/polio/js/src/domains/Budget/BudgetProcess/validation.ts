import * as yup from 'yup';

import { useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../messages';

export const useCreateBudgetProcessSchema = () => {
    const { formatMessage } = useSafeIntl();
    return yup.object().shape({
        country: yup
            .number()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField))
            .integer()
            .typeError(formatMessage(MESSAGES.requiredPositiveInteger)),
        campaign: yup
            .string()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField))
            .uuid()
            .typeError(formatMessage(MESSAGES.requiredUuid)),
        rounds: yup
            .string()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
    });
};

export const useEditBudgetProcessSchema = () => {
    return yup.object().shape({
        rounds: yup
            .array(
                yup.object().shape({
                    id: yup.number().nullable(),
                }),
            )
            .nullable(),
    });
};
