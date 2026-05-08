import { Pagination } from 'bluesquare-components';
import { UseQueryResult } from 'react-query';
import { APIImport } from 'Iaso/domains/apiimports/types/apiimport';
import { Params } from 'Iaso/domains/apiimports/types/filters';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { makeUrlWithParams } from 'Iaso/libs/utils';

export interface PaginatedApiImports extends Pagination {
    results: Array<APIImport>;
}

type ApiParams = {
    limit?: string;
    order: string;
    page?: string;
    created_by?: string;
    import_type?: string;
    has_problem?: boolean;
    app_id?: string;
    app_version?: string;
};

export const useGetApiImports = (
    params: Params,
): UseQueryResult<PaginatedApiImports, Error> => {
    const apiParams: ApiParams = {
        order: params.order || '-created_at',
        created_by: params.createdBy,
        import_type: params.importType,
        has_problem: params.hasProblem,
        app_id: params.appId,
        app_version: params.appVersion,
        limit: params.pageSize || '10',
        page: params.page || '1',
    };
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
