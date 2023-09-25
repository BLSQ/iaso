/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import { Pagination } from 'bluesquare-components';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import { ModuleParams, ModulesFilterParams, Module } from '../../types/modules';

type ModulesList = Pagination & {
    results: Module[];
};

const getModules = async (
    options: ModuleParams | ModulesFilterParams,
): Promise<ModulesList> => {
    const { pageSize, order, page, ...params } = options as Record<string, any>;

    params.limit = pageSize || 20;
    params.order = order || 'name';
    params.page = page || 1;
    if (params.select) {
        delete params.select;
    }
    const url = makeUrlWithParams('/api/modules', params);
    return getRequest(url) as Promise<ModulesList>;
};

export const useGetModules = (
    options: ModuleParams | ModulesFilterParams,
): UseQueryResult<ModulesList, Error> => {
    const { select } = options as Record<string, any>;
    return useSnackQuery({
        queryKey: ['modulesList', options],
        queryFn: () => getModules(options),
        options: {
            select,
        },
    });
};
