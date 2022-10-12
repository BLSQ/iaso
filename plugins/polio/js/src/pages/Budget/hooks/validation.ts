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
    addMethod,
} from 'yup';
import MESSAGES from '../../../constants/messages';
import { ValidationError } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { useAPIErrorValidator } from '../../../../../../../hat/assets/js/apps/Iaso/libs/validation';

const makeRequired = (validator, required: boolean, errorMsg: string) => {
    if (required) {
        return validator.required(errorMsg);
    }
    return validator;
};

addMethod(
    mixed,
    'fileOrLinks',
    function fileOrLinks(enableTest, formatMessage) {
        return this.test('fileOrLinks', '', (_value, context) => {
            if (!enableTest) return true;
            const { path, createError, parent } = context;
            if (!parent.files && !parent.links) {
                return createError({
                    path,
                    message: formatMessage(MESSAGES.linksOrFilesRequired),
                });
            }
            return true;
        });
    },
);
addMethod(
    array,
    'linksOrFiles',
    function fileOrLinks(enableTest, formatMessage) {
        return this.test('linksOrFiles', '', (_value, context) => {
            if (!enableTest) return true;
            const { path, createError, parent } = context;
            if (!parent.files && !parent.links) {
                return createError({
                    path,
                    message: formatMessage(MESSAGES.linksOrFilesRequired),
                });
            }
            return true;
        });
    },
);

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
            ).fileOrLinks(
                requiredFields.includes('attachments'),
                formatMessage,
            ),
            links: makeRequired(
                array().of(
                    object({
                        alias: string().required(fieldRequired),
                        url: string().required(fieldRequired),
                    }),
                ),
                requiredFields.includes('files'),
                fieldRequired,
            ).linksOrFiles(
                requiredFields.includes('attachments'),
                formatMessage,
            ),
            comment: makeRequired(
                string().nullable(),
                requiredFields.includes('comment'),
                fieldRequired,
            ),
            amount: makeRequired(
                number().nullable(),
                requiredFields.includes('amount'),
                fieldRequired,
            ).typeError(typeError),
            general: mixed().nullable().test(apiValidator('general')),
        });
    }, [apiValidator, fieldRequired, formatMessage, requiredFields, typeError]);
};
