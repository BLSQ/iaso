import { useMemo } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { array, mixed, object, string } from 'yup';
import MESSAGES from '../../../constants/messages';

export const useBudgetEvenValidation = () => {
    const { formatMessage } = useSafeIntl();
    const fieldRequired = formatMessage(MESSAGES.requiredField);
    return useMemo(() => {
        return object().shape({
            file: mixed().nullable(),
            cc_emails: string().email().nullable(),
            comments: string().nullable(),
            target_teams: array()
                .min(1, fieldRequired)
                .nullable()
                .required(fieldRequired),
            type: string()
                .oneOf(['submission', 'comments']) // TODO add translation for this error
                .nullable()
                .required(fieldRequired),
        });
    }, [fieldRequired]);
};
