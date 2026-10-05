import { useMemo } from 'react';
import { object, string, number, array } from 'yup';
import { useAPIErrorValidator } from 'Iaso/libs/validation';
import { ValidationError } from 'Iaso/types/utils';
import { SaveTeamQuery } from './hooks/requests/useSaveTeam';

export const useTeamValidation = (
    errors: ValidationError = {},
    payload: Partial<SaveTeamQuery>,
) => {
    const apiValidator = useAPIErrorValidator<Partial<SaveTeamQuery>>(
        errors,
        payload,
    );

    return useMemo(
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
};
