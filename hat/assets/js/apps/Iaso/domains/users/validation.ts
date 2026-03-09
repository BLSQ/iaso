import { useMemo } from 'react';
import { object, string, ObjectSchema, ref } from 'yup';
import { SaveUserPasswordQuery } from 'Iaso/domains/users/types';
import { useAPIErrorValidator } from 'Iaso/libs/validation';
import { ValidationError } from '../../types/utils';

export const useUserPasswordValidation = (
    errors: ValidationError = {},
    payload: Partial<SaveUserPasswordQuery>,
): ObjectSchema<any> => {
    const apiValidator = useAPIErrorValidator<Partial<SaveUserPasswordQuery>>(
        errors,
        payload,
    );

    const schema = useMemo(
        () =>
            object().shape({
                password: string()
                    .required('requiredField')
                    .test(apiValidator('password')),
                confirm_password: string()
                    .required('requiredField')
                    .oneOf([ref('password')], 'passwordMatch')
                    .test(apiValidator('confirm_password')),
            }),
        [apiValidator],
    );
    return schema;
};
