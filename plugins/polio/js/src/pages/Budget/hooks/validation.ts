import { useMemo } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { array, mixed, object, string, bool, number, ObjectSchema } from 'yup';
import MESSAGES from '../../../constants/messages';
import {
    makeRegexValidator,
    urlRegex,
} from '../../../../../../../hat/assets/js/apps/Iaso/libs/utils';
import { ValidationError } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { useAPIErrorValidator } from '../../../../../../../hat/assets/js/apps/Iaso/libs/validation';

const multipleUrlsValidator = makeRegexValidator(urlRegex);

export const useBudgetEventValidation = (
    errors: ValidationError = {},
    payload: any,
): ObjectSchema<any> => {
    const { formatMessage } = useSafeIntl();
    // const fieldRequired = formatMessage(MESSAGES.requiredField);
    const urlFormat = formatMessage(MESSAGES.urlFormat);
    const typeError = formatMessage(MESSAGES.budgetTypeError);
    const apiValidator = useAPIErrorValidator<Partial<any>>(errors, payload);
    return useMemo(() => {
        return object().shape({
            file: mixed().nullable(),
            links: string()
                .nullable()
                .test(
                    multipleUrlsValidator(urlFormat, 'multiple url validation'),
                ),
            comments: string().nullable(),
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
            amount: number().nullable().typeError(typeError),
            general: mixed().nullable().test(apiValidator('general')),
        });
    }, [apiValidator, typeError, urlFormat]);
};
