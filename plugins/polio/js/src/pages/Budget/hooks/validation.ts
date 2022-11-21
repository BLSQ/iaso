import { useMemo } from 'react';
// @ts-ignore
import { useSafeIntl, convertToNumber } from 'bluesquare-components';
import { mixed, array, object, string, ObjectSchema, addMethod } from 'yup';
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
    string,
    'isUrlRequired',
    function isUrlRequired(isLinkRequired, message) {
        return this.test('isUrlRequired', '', (value, context) => {
            const { path, createError, parent } = context;
            if ((isLinkRequired && !value) || (parent.alias && !value)) {
                return createError({
                    path,
                    message,
                });
            }
            return true;
        });
    },
);
addMethod(
    string,
    'isAliasRequired',
    function isAliasRequired(isLinkRequired, message) {
        return this.test('isAliasRequired', '', (value, context) => {
            const { path, createError, parent } = context;
            if ((isLinkRequired && !value) || (parent.url && !value)) {
                return createError({
                    path,
                    message,
                });
            }
            return true;
        });
    },
);

addMethod(
    string,
    'convertNumberWithThousands',
    function convertNumberWithThousands(message) {
        return this.test('convertNumberWithThousands', '', (value, context) => {
            const { path, createError } = context;
            if (!Number.isNaN(convertToNumber(value))) {
                return true;
            }
            return createError({
                path,
                message,
            });
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
            files: makeRequired(
                mixed().nullable(),
                requiredFields.includes('files'),
                fieldRequired,
            ),
            links: makeRequired(
                array().of(
                    object({
                        alias: string()
                            .nullable()
                            // @ts-ignore
                            .isAliasRequired(
                                requiredFields.includes('links'),
                                fieldRequired,
                            ),
                        url: string()
                            .nullable()
                            // @ts-ignore
                            .isUrlRequired(
                                requiredFields.includes('links'),
                                fieldRequired,
                            ),
                    }),
                ),
                requiredFields.includes('files'),
                fieldRequired,
            ),
            comment: makeRequired(
                string().nullable(),
                requiredFields.includes('comment'),
                fieldRequired,
            ),
            amount: makeRequired(
                // @ts-ignore
                string().nullable().convertNumberWithThousands(formatMessage),
                requiredFields.includes('amount'),
                fieldRequired,
            ).typeError(typeError),
            general: mixed().nullable().test(apiValidator('general')),
            attachments: mixed()
                .nullable()
                // @ts-ignore
                .fileOrLinks(
                    requiredFields.includes('attachments'),
                    formatMessage,
                ),
        });
    }, [apiValidator, fieldRequired, formatMessage, requiredFields, typeError]);
};
