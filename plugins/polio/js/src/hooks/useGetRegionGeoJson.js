import { useQuery } from 'react-query';
import { sendRequest } from '../utils/networking';
import { useGetAuthenticatedUser } from './useGetAuthenticatedUser';

export const useGetRegionGeoJson = region => {
    const { data: user = {}, isFetching } = useGetAuthenticatedUser();
    const source = user?.account?.default_version?.data_source?.id || '';
    const params = {
        source,
        validation_status: 'all',
        asLocation: true,
        limit: 3000,
        order: 'id',
        orgUnitParentId: region,
        orgUnitTypeCategory: 'DISTRICT',
    };

    return useQuery(
        ['geo_json', params],
        () => {
            const queryString = new URLSearchParams(params);
            return sendRequest(
                'GET',
                `/api/orgunits/?${queryString.toString()}`,
            );
        },
        {
            enabled: Boolean(region) && isFetching,
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
        },
    );
};
