import { useMemo } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import {
    mixed,
    array,
    object,
    string,
    number,
    ObjectSchema,
    StringSchema,
    NumberSchema,
} from 'yup';
import { MixedSchema } from 'yup/lib/mixed';
import MESSAGES from '../../../constants/messages';
// import {
//     makeRegexValidator,
//     urlRegex,
// } from '../../../../../../../hat/assets/js/apps/Iaso/libs/utils';
import { ValidationError } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { useAPIErrorValidator } from '../../../../../../../hat/assets/js/apps/Iaso/libs/validation';

const makeRequired = (validator, required: boolean, errorMsg: string) => {
    if (required) {
        return validator.required(errorMsg);
    }
    return validator;
};

export const useBudgetStepValidation = (
    errors: ValidationError = {},
    payload: any,
    requiredFields: string[] = ['links', 'comment'],
): ObjectSchema<any> => {
    const { formatMessage } = useSafeIntl();
    const fieldRequired = formatMessage(MESSAGES.requiredField);
    const typeError = formatMessage(MESSAGES.budgetTypeError);
    const apiValidator = useAPIErrorValidator<Partial<any>>(errors, payload);
    return useMemo(() => {
        return object().shape({
            file: makeRequired(
                mixed().nullable(),
                requiredFields.includes('files'),
                fieldRequired,
            ) as MixedSchema, // .test(linkOrFile)
            links: makeRequired(
                array().of(
                    object({
                        alias: string().required(fieldRequired),
                        url: string().required(fieldRequired),
                    }),
                ),
                requiredFields.includes('files'),
                fieldRequired,
            ),
            comment: makeRequired(
                string().nullable(),
                requiredFields.includes('comment'),
                fieldRequired,
            ) as StringSchema,
            // internal: bool().nullable().required(fieldRequired),
            // target_teams: array()
            //     .min(1, fieldRequired)
            //     .nullable()
            //     .required(fieldRequired),
            // type: string()
            //     .oneOf([
            //         'submission',
            //         'comments',
            //         'validation',
            //         'request',
            //         'feedback',
            //         'review',
            //         'transmission',
            //     ]) // TODO add translation for this error
            //     .nullable()
            //     .required(fieldRequired)
            //     .typeError(typeError),
            amount: (
                makeRequired(
                    number().nullable(),
                    requiredFields.includes('amount'),
                    fieldRequired,
                ) as NumberSchema
            ).typeError(typeError),
            general: mixed().nullable().test(apiValidator('general')),
        });
    }, [apiValidator, fieldRequired, requiredFields, typeError]);
};
