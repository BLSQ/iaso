import { useMemo } from 'react';
import { mixed, object, ObjectSchema } from 'yup';
import { useSafeIntl } from 'bluesquare-components';
import { useAPIErrorValidator } from '../../../../../libs/validation';
import { ValidationError } from '../../../../../types/utils';
import MESSAGES from '../../../messages';

export const useBulkUserValidation = (
    errors: ValidationError,
    payload: any,
): ObjectSchema<any> => {
    const { formatMessage } = useSafeIntl();
    const apiValidator = useAPIErrorValidator<Partial<any>>(errors, payload);
    return useMemo(() => {
        return object().shape({
            file: mixed()
                .nullable()
                .required(formatMessage(MESSAGES.fieldRequired))
                .test(apiValidator('file')),
        });
    }, [apiValidator, formatMessage]);
};
