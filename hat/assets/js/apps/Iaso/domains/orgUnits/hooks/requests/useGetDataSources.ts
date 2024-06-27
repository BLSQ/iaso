/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

import { DropdownOptionsWithOriginal } from '../../../../types/utils';

import { DataSource, DataSourcesApi } from '../../types/dataSources';

import { staleTime } from '../../config';

const getDataSources = (): Promise<DataSourcesApi> => {
    return getRequest('/api/datasources/');
};

export const useGetDataSources = (): UseQueryResult<
    DropdownOptionsWithOriginal<DataSource>[],
    Error
> => {
    const queryKey: any[] = ['sources'];
    // @ts-ignore
    return useSnackQuery({
        queryKey,
        queryFn: () => getDataSources(),
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
