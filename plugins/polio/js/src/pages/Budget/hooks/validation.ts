import { useMemo } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { array, mixed, object, string, bool } from 'yup';
import MESSAGES from '../../../constants/messages';
import {
    makeRegexValidator,
    urlRegex,
} from '../../../../../../../hat/assets/js/apps/Iaso/libs/utils';

const multipleUrlsValidator = makeRegexValidator(urlRegex);

export const useBudgetEvenValidation = () => {
    const { formatMessage } = useSafeIntl();
    const fieldRequired = formatMessage(MESSAGES.requiredField);
    const urlFormat = formatMessage(MESSAGES.urlFormat);
    const typeError = formatMessage(MESSAGES.budgetTypeError);
    return useMemo(() => {
        return object().shape({
            file: mixed().nullable(),
            links: string()
                .nullable()
                .test(
                    multipleUrlsValidator(urlFormat, 'multiple url validation'),
                ),
            comments: string().nullable(),
            target_teams: array()
                .min(1, fieldRequired)
                .nullable()
                .required(fieldRequired),
            type: string()
                .oneOf(['submission', 'comments', 'validation']) // TODO add translation for this error
                .nullable()
                .required(fieldRequired)
                .typeError(typeError),
            internal: bool().nullable().required(fieldRequired),
        });
    }, [fieldRequired, typeError, urlFormat]);
};
