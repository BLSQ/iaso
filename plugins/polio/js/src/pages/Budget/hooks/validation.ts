import { useMemo } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { mixed, bool, array, object, string, number, ObjectSchema, StringSchema, ArraySchema, NumberSchema } from 'yup';
import MESSAGES from '../../../constants/messages';
// import {
//     makeRegexValidator,
//     urlRegex,
// } from '../../../../../../../hat/assets/js/apps/Iaso/libs/utils';
import { ValidationError } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { useAPIErrorValidator } from '../../../../../../../hat/assets/js/apps/Iaso/libs/validation';
import { MixedSchema } from 'yup/lib/mixed';

enum YupType{
    "string"="string",
    "mixed" = "mixed",
    "number"="number",
    "bool" = "bool",
    "array" = "array",
    "object" = "object",
}

const makeRequired = (type:YupType,required:boolean, errorMsg:string)=>{
    switch(type){
        case YupType.string:
            return required?string().nullable().required(errorMsg): string().nullable()
        case YupType.number:
            return required?number().nullable().required(errorMsg): number().nullable()
        case YupType.bool:
            return required?bool().nullable().required(errorMsg): bool().nullable()
        case YupType.mixed:
            return required? mixed().nullable().required(errorMsg): mixed().nullable()
        case YupType.array:
            return required?array().nullable().required(errorMsg): array().nullable()
        default:
            mixed().nullable()
    }
}

export const useBudgetStepValidation = (
    errors: ValidationError = {},
    payload: any,
    requiredFields: string[] = ["links","comment"],
): ObjectSchema<any> => {
    const { formatMessage } = useSafeIntl();
    const fieldRequired = formatMessage(MESSAGES.requiredField);
    const urlFormat = formatMessage(MESSAGES.urlFormat);
    const typeError = formatMessage(MESSAGES.budgetTypeError);
    const apiValidator = useAPIErrorValidator<Partial<any>>(errors, payload);
    return useMemo(() => {
        return object().shape({
            file: makeRequired(YupType.mixed,requiredFields.includes('files'),fieldRequired) as MixedSchema, // .test(linkOrFile)
            links:makeRequired(YupType.array,requiredFields.includes('links'),fieldRequired).of(object({
                alias:string().required(fieldRequired),
                url:string().required(fieldRequired)
            })),
            comment: makeRequired(YupType.string,true,fieldRequired) as StringSchema,
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
            amount: (makeRequired(YupType.number,requiredFields.includes('amount'),fieldRequired)as NumberSchema).typeError(typeError) ,
            general: mixed().nullable().test(apiValidator('general')),
        });
    }, [apiValidator, typeError, urlFormat]);
};
