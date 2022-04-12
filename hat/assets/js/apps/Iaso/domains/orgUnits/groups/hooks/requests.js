import { useSnackQuery, useSnackMutation } from '../../../../libs/apiHooks';
import {
    getRequest,
    deleteRequest,
    postRequest,
    patchRequest,
} from '../../../../libs/Api';

import MESSAGES from '../messages';

export const useGetGroups = params => {
    const newParams = {
        limit: params.pageSize || '20',
        order: params.order || 'id',
        page: params.page || '1',
    };
    if (params.search) {
        newParams.search = params.search;
    }
    const searchParams = new URLSearchParams(newParams);
    return useSnackQuery(
        ['groups', newParams],
        () => getRequest(`/api/groups/?${searchParams.toString()}`),
        undefined,
        {
            // using this here to avoid multiple identical calls
            staleTime: 60000,
        },
    );
};

export const useSaveGroups = () =>
    useSnackMutation(
        body =>
            body.id
                ? patchRequest(`/api/groups/${body.id}/`, body)
                : postRequest('/api/groups/', body),
        undefined,
        undefined,
        ['groups'],
    );

export const useDeleteGroups = () =>
    useSnackMutation(
        body => deleteRequest(`/api/groups/${body.id}/`),
        MESSAGES.deleteSuccess,
        MESSAGES.deleteError,
        ['groups'],
    );
