import { useMemo } from 'react';
import { object, string, number, array, ObjectSchema } from 'yup';
import { ValidationError } from '../../types/utils';
import { SaveUserRoleQuery } from './hooks/requests/useSaveUserRole';
import { useAPIErrorValidator } from '../../libs/validation';

export const useUserRoleValidation = (
    errors: ValidationError = {},
    payload: Partial<SaveUserRoleQuery>,
): ObjectSchema<any> => {
    const apiValidator = useAPIErrorValidator<Partial<SaveUserRoleQuery>>(
        errors,
        payload,
    );

    const schema = useMemo(() => {
        return object().shape({
            name: string().nullable().required('requiredField'),
            permissions: array()
                .of(
                    object({
                        id: number(),
                        name: string(),
                        codename: string(),
                    }),
                )
                .test(apiValidator('permissions')),
        });
    }, [apiValidator]);
    return schema;
};
