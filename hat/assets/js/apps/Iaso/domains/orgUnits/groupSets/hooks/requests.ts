import { UseMutationResult, UseQueryResult } from 'react-query';
import {
    deleteRequest,
    getRequest,
    optionsRequest,
    patchRequest,
    postRequest,
} from '../../../../libs/Api';
import { useSnackMutation, useSnackQuery } from '../../../../libs/apiHooks';

import { GroupSetMetaData } from '../types/GroupSetMetaData';

import MESSAGES from '../messages';

interface GetGroupSetsParams {
    pageSize?: string;
    order?: string;
    limit?: string;
    page?: string;
    search?: string;
    version?: string;
    project_ids?: string;
}

export const useGetGroupSets = params => {
    const newParams: GetGroupSetsParams = {
        limit: params.pageSize || '10',
        order: params.order || 'id',
        page: params.page || '1',
    };
    if (params.search) {
        newParams.search = params.search;
    }

    if (params.sourceVersion) {
        newParams.version = params.sourceVersion;
    }
    if (params.projectsIds) {
        newParams.project_ids = params.projectsIds;
    }

    const searchParams = new URLSearchParams(
        newParams as Record<string, string>,
    );
    return useSnackQuery(
        ['groupSets', searchParams.toString()],
        () =>
            getRequest(
                `/api/group_sets/?${searchParams.toString()}&fields=id,name,groups,created_at,updated_at`,
            ),
        undefined,
        {
            // using this here to avoid multiple identical calls
            staleTime: 60000,
        },
    );
};

export const useGetGroupSet = groupSetId => {
    return useSnackQuery(
        ['groupSet', groupSetId],
        () => {
            // if create
            if (groupSetId === 'new') {
                return Promise.resolve({});
            }
            return getRequest(`/api/group_sets/${groupSetId}/?fields=:all`);
        },
        undefined,
        {},
    );
};
export const useSaveGroupSet = (): UseMutationResult<any, any, any, any> =>
    useSnackMutation(
        body => {
            if (body.id) {
                return patchRequest(`/api/group_sets/${body.id}/`, body);
            }
            return postRequest('/api/group_sets/', body);
        },
        undefined,
        undefined,
        ['groupSets', 'groupSet'],
    );

export const useDeleteGroupSet = () =>
    useSnackMutation(
        body => deleteRequest(`/api/group_sets/${body.id}/`),
        MESSAGES.deleteSuccess,
        MESSAGES.deleteError,
        ['groupSets', 'groupSet'],
    );

const mapChoices = choices =>
    choices.map(choice => ({
        label: choice.display_name,
        value: choice.value,
    }));

export const useOptionGroupSet = (): UseQueryResult<GroupSetMetaData, Error> =>
    useSnackQuery({
        queryKey: ['optionGroupSet'],
        queryFn: () => optionsRequest(`/api/group_sets/`),
        options: {
            staleTime: 1000 * 60 * 15, // in ms
            cacheTime: 1000 * 60 * 5,
            select: data => {
                const metadata = data.actions.OPTIONS;
                const mapped = {
                    groupBelonging: mapChoices(
                        metadata.group_belonging.choices,
                    ),
                };
                return mapped;
            },
        },
    });
