import { Paginated } from 'bluesquare-components';
import { UseQueryResult } from 'react-query';
import {
    APIImport,
    APIImportFilters,
} from 'Iaso/domains/apiimports/types/apiimport';
import { Params } from 'Iaso/domains/apiimports/types/filters';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { makeUrlWithParams } from 'Iaso/libs/utils';

export type PaginatedApiImports = Paginated<APIImport>;

type ApiParams = {
    limit?: string;
    order: string;
    page?: string;
    created_by?: string;
    import_type?: string;
    has_problem?: boolean;
    app_id?: string;
    app_version?: string;
    from_date?: string;
    to_date?: string;
    user_id?: string;
};

export const paramsToApiParams = (params: Params): ApiParams => {
    return {
        order: params.order || '-created_at',
        created_by: params.createdBy,
        import_type: params.importType,
        has_problem: params.hasProblem,
        app_id: params.appId,
        app_version: params.appVersion,
        from_date: params.fromDate,
        to_date: params.toDate,
        user_id: params.userId,
        limit: params.pageSize || '10',
        page: params.page || '1',
    };
};

export const useGetApiImports = (
    params: Params,
): UseQueryResult<PaginatedApiImports, Error> => {
    const apiParams: ApiParams = paramsToApiParams(params);
    const url = makeUrlWithParams('/api/api_import/', apiParams);
    return useSnackQuery({
        queryKey: ['apiimports', params],
        queryFn: () => getRequest(url),
        options: {
            staleTime: 60,
            cacheTime: 60,
            keepPreviousData: true,
        },
    });
};

export const useGetApiImportsFilters = (): UseQueryResult<
    APIImportFilters,
    Error
> => {
    return useSnackQuery({
        queryKey: ['apiimportsfilters'],
        queryFn: () => getRequest('/api/api_import/filters/'),
        options: {
            staleTime: 60,
            cacheTime: 60,
            keepPreviousData: true,
        },
    });
};
