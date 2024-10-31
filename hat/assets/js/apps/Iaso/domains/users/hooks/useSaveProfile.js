import { useCallback } from 'react';
import { useSnackMutation } from 'Iaso/libs/apiHooks.ts';
import { postRequest, patchRequest } from 'Iaso/libs/Api.ts';
import { useCurrentUser } from '../../../utils/usersUtils';
import { userHasPermission } from '../utils';
import { USERS_ADMIN, USERS_MANAGEMENT } from '../../../utils/permissions';

export const useSaveProfile = () => {
    const currentUser = useCurrentUser();
    const hasRestrictedPerm =
        userHasPermission(USERS_MANAGEMENT, currentUser) &&
        !userHasPermission(USERS_ADMIN, currentUser);

    const saveProfile = useCallback(
        body => {
            if (!body.id) {
                return postRequest('/api/profiles/', body);
            }
            if (!hasRestrictedPerm) {
                return patchRequest(`/api/profiles/${body.id}/`, body);
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
            const { projects, ...toSend } = body;
            return patchRequest(`/api/profiles/${body.id}/`, toSend);
        },
        [hasRestrictedPerm],
    );

    return useSnackMutation(saveProfile, undefined, undefined, [
        'profiles',
        'usersHistoryList',
    ]);
};
