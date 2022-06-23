import { useMemo } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { array, mixed, object, string } from 'yup';
import MESSAGES from '../../../constants/messages';
import { emailRegex } from '../../../../../../../hat/assets/js/apps/Iaso/libs/utils';

const multipleEmailsValidator = (message: string) => ({
    name: 'multiple email validation',
    message,
    test: (value: string) => {
        const emails = value.split(', ');
        for (let i = 0; i < emails.length; i += 1) {
            if (!emails[i].match(emailRegex)) {
                return false;
            }
        }
        return true;
    },
});

export const useBudgetEvenValidation = () => {
    const { formatMessage } = useSafeIntl();
    const fieldRequired = formatMessage(MESSAGES.requiredField);
    const emailFormat = formatMessage(MESSAGES.emailFormat);
    const typeError = formatMessage(MESSAGES.budgetTypeError);
    return useMemo(() => {
        return object().shape({
            file: mixed().nullable(),
            cc_emails: string()
                .nullable()
                .test(multipleEmailsValidator(emailFormat)),
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
        });
    }, [emailFormat, fieldRequired, typeError]);
};
