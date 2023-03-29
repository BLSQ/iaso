import { useMemo } from 'react';
import { mixed, object, ObjectSchema } from 'yup';
import { useSafeIntl } from 'bluesquare-components';
import { ValidationError } from '../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { useAPIErrorValidator } from '../../../../../../hat/assets/js/apps/Iaso/libs/validation';
import MESSAGES from '../../constants/messages';

export const useImportLineValidation = (
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
