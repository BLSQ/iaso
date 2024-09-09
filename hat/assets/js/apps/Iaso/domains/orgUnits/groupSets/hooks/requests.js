import { useSnackQuery, useSnackMutation } from '../../../../libs/apiHooks';
import {
    getRequest,
    deleteRequest,
    postRequest,
    patchRequest,
} from '../../../../libs/Api';

import MESSAGES from '../messages';

export const useGetGroupSets = params => {
    const newParams = {
        limit: params.pageSize || '20',
        order: params.order || 'id',
        page: params.page || '1',
    };
    if (params.search) {
        newParams.search = params.search;
    }

    if (params.sourceVersion) {
        newParams.version = params.sourceVersion
    }
    if (params.projectsIds) {
        newParams.project_ids = params.projectsIds
    }
    debugger
    
    const searchParams = new URLSearchParams(newParams);
    return useSnackQuery(
        ['group_sets', newParams],
        () => getRequest(`/api/group_sets/?${searchParams.toString()}&fields=id,name,groups,created_at,updated_at`),
        undefined,
        {
            // using this here to avoid multiple identical calls
            staleTime: 60000,
        },
    );
};

export const useSaveGroupSet = () =>
    useSnackMutation(
        body =>
            body.id
                ? patchRequest(`/api/group_sets/${body.id}/`, body)
                : postRequest('/api/group_sets/', body),
        undefined,
        undefined,
        ['group_sets'],
    );

export const useDeleteGroups = () =>
    useSnackMutation(
        body => deleteRequest(`/api/group_sets/${body.id}/`),
        MESSAGES.deleteSuccess,
        MESSAGES.deleteError,
        ['group_sets'],
    );
