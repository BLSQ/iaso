import { useMemo } from 'react';
import { object, string, number, ObjectSchema } from 'yup';
import { ValidationError } from '../../types/utils';
import { useAPIErrorValidator } from '../../libs/validation';
import { SaveProfileQuery } from './hooks/useSaveProfile';

export const useProfileValidation = (
    errors: ValidationError = {},
    payload: Partial<SaveProfileQuery>,
): ObjectSchema<any> => {
    const apiValidator = useAPIErrorValidator<Partial<SaveProfileQuery>>(
        errors,
        payload,
    );

    const schema = useMemo(
        () =>
            object().shape({
                id: number().nullable(),
                user_name: string().nullable().required('requiredField'),
                first_name: string().nullable(),
                last_name: string().nullable(),
                email: string().nullable(),
                password: string().nullable().required('requiredField'),
                dhis2_id: string().nullable(),
                home_page: string().nullable(),
                language: string().nullable(),
            }),
        [apiValidator],
    );
    return schema;
};
