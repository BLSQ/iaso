/* eslint-disable camelcase */
import { UseMutationResult } from 'react-query';
import { patchRequest, postRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';

export type SaveProfileQuery = {
    id?: number;
    user_name: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    password: string;
    dhis2_id?: string;
    home_page?: string;
    language?: string;
};

const endpoint = '/api/profiles/';

// const convertToApi = data => {
//     const { subTeams, ...converted } = data;
//     if (subTeams !== undefined) {
//         converted.sub_teams = subTeams;
//     }
//     return converted;
// };

// export const convertAPIErrorsToState = data => {
//     const { sub_teams, ...converted } = data;
//     if (sub_teams !== undefined) {
//         converted.subTeams = sub_teams;
//     }
//     return converted;
// };

const patchProfile = async (body: Partial<SaveProfileQuery>) => {
    const url = `${endpoint}${body.id}/`;
    return patchRequest(url, body);
};

const postProfile = async (body: SaveProfileQuery) => {
    return postRequest(endpoint, body);
};

export const useSaveProfile = (type: 'create' | 'edit'): UseMutationResult => {
    const ignoreErrorCodes = [400];
    const editProfile = useSnackMutation({
        mutationFn: (data: Partial<SaveProfileQuery>) => patchProfile(data),
        invalidateQueryKey: ['profiles'],
        ignoreErrorCodes,
    });
    const createProfile = useSnackMutation({
        mutationFn: (data: SaveProfileQuery) => postProfile(data),
        invalidateQueryKey: ['profiles'],
        ignoreErrorCodes,
    });

    switch (type) {
        case 'create':
            return createProfile;
        case 'edit':
            return editProfile;
        default:
            throw new Error(
                `wrong type expected: create, copy or edit, got:  ${type} `,
            );
    }
};
