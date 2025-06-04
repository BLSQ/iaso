import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import { Version } from '../types/dataSources';

const getDataSourceVersion = async (
    version: string | undefined,
): Promise<Version> => {
    return getRequest(`/api/sourceversions/${version}/`);
};

export const useGetDataSourceVersion = (
    versionId: string | undefined,
): UseQueryResult<Version, Error> => {
    const queryKey: any[] = ['sourceVersions', versionId];
    return useSnackQuery({
        queryKey,
        queryFn: () => getDataSourceVersion(versionId),
        snackErrorMsg: undefined,
        options: {
            staleTime: 60000,
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: true,
            enabled: !!versionId,
        },
    });
};
