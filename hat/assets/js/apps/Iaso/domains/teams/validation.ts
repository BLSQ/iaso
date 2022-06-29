import { useMemo } from 'react';
import { object, string, number, array, ObjectSchema } from 'yup';
import { ValidationError } from '../../types/utils';
import { SaveTeamQuery } from './hooks/requests/useSaveTeam';
import { useAPIErrorValidator } from '../../libs/validation';

export const useTeamValidation = (
    errors: ValidationError = {},
    payload: Partial<SaveTeamQuery>,
): ObjectSchema<any> => {
    const apiValidator = useAPIErrorValidator<Partial<SaveTeamQuery>>(
        errors,
        payload,
    );

    const schema = useMemo(
        () =>
            object().shape({
                name: string().nullable().required('requiredField'),
                description: string().nullable(),
                project: number().nullable().required('requiredField'),
                subTeams: array().of(number()).test(apiValidator('subTeams')),
                manager: string().nullable().required('requiredField'),
                type: string().nullable(),
                users: array().of(number()),
            }),
        [apiValidator],
    );
    return schema;
};
