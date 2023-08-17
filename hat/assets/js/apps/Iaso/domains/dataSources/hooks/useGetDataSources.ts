/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import { DataSource } from '../types/dataSources';

const getDataSource = async (
    sourceId: string | undefined,
): Promise<DataSource> => {
    return getRequest(`/api/datasources/${sourceId}/`);
};

export const useGetDataSource = (
    sourceId: string | undefined,
): UseQueryResult<DataSource, Error> => {
    const queryKey: any[] = ['dataSource', sourceId];
    return useSnackQuery({
        queryKey,
        queryFn: () => getDataSource(sourceId),
        snackErrorMsg: undefined,
        options: {
            staleTime: 60000,
        },
    });
};
