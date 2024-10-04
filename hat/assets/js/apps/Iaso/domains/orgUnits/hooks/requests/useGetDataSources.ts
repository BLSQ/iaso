import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

import { DropdownOptionsWithOriginal } from '../../../../types/utils';

import { DataSource, DataSourcesApi } from '../../types/dataSources';

import { staleTime } from '../../config';

const getDataSources = (
    filterEmptyVersions = false,
): Promise<DataSourcesApi> => {
    return getRequest(
        `/api/datasources/?filter_empty_versions=${filterEmptyVersions}`,
    );
};

export const useGetDataSources = (
    filterEmptyVersions = false,
): UseQueryResult<DropdownOptionsWithOriginal<DataSource>[], Error> => {
    const queryKey: any[] = ['sources', filterEmptyVersions];
    // @ts-ignore
    return useSnackQuery({
        queryKey,
        queryFn: () => getDataSources(filterEmptyVersions),
        options: {
            staleTime,
            select: data => {
                if (!data) return [];
                return data.sources.map(dataSource => {
                    return {
                        value: dataSource.id.toString(),
                        label: dataSource.name,
                        original: dataSource,
                    };
                });
            },
        },
    });
};
