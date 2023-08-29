import { object, string, ObjectSchema } from 'yup';
import { useMemo } from 'react';
import { ValidationError } from '../../types/utils';
import { SaveAccountQuery } from './hooks/useSaveAccount';
import { useAPIErrorValidator } from '../../libs/validation';

export const useAccountValidation = (
    errors: ValidationError = {},
    payload: Partial<SaveAccountQuery>,
): ObjectSchema<any> => {
    const apiValidator = useAPIErrorValidator<Partial<SaveAccountQuery>>(
        errors,
        payload,
    );

    const schema = useMemo(() => {
        return object().shape({
            account_name: string()
                .nullable()
                .required('requiredField')
                .test(apiValidator('account_name')),
            user_username: string()
                .nullable()
                .required('requiredField')
                .test(apiValidator('user_username')),
            user_first_name: string().nullable().required('requiredField'),
            user_last_name: string().nullable().required('requiredField'),
            password: string().nullable().required('requiredField'),
        });
    }, [apiValidator]);
    return schema;
};
