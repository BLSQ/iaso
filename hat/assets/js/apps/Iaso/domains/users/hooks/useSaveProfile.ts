import { UseMutationResult } from 'react-query';
import { patchRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { DjangoError } from 'Iaso/types/general';
import { User } from 'Iaso/utils/usersUtils';

type UseSaveProfileParams = {
    id?: number | string;
    showSuccessSnackBar?: boolean;
};

export const useSaveProfile = ({
    id,
    showSuccessSnackBar = true,
}: UseSaveProfileParams = {}): UseMutationResult<
    User,
    DjangoError,
    User | Partial<User>
> =>
    useSnackMutation({
        mutationFn: ({ id: userId, ...body }) =>
            patchRequest(`/api/trypelim/profiles/${id ?? userId}/`, body),
        invalidateQueryKey: [
            'profiles',
            'usersHistoryList',
            'team',
            'userDetail',
        ],
        showSuccessSnackBar,
    });
