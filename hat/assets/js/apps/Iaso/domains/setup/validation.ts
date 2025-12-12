import { useMemo } from 'react';
import { object, string, ObjectSchema, array, boolean } from 'yup';
import { useAPIErrorValidator } from '../../libs/validation';
import { ValidationError } from '../../types/utils';
import { SaveAccountQuery } from './hooks/useSaveAccount';

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
            user_first_name: string().nullable(),
            user_last_name: string().nullable(),
            user_email: string()
                .nullable()
                .when('email_invitation', {
                    is: true,
                    then: schema => schema.required('requiredField'),
                    otherwise: schema => schema.nullable(),
                })
                .test(apiValidator('user_email')),
            email_invitation: boolean().nullable(),
            language: string().nullable(),
            password: string()
                .nullable()
                .when('email_invitation', {
                    is: false,
                    then: schema => schema.required('requiredField'),
                    otherwise: schema => schema.nullable(),
                })
                .test(apiValidator('password')),
            modules: array().of(string()).nullable().required('requiredField'),
            create_main_org_unit: boolean().nullable(),
            create_demo_form: boolean().nullable(),
        });
    }, [apiValidator]);
    return schema;
};
