import { useQuery } from 'react-query';
import { sendRequest } from '../utils/networking';
import { useGetAuthenticatedUser } from './useGetAuthenticatedUser';

export const useGetGeoJson = (country, orgUnitCategory) => {
    const { data: user = {}, isFetching } = useGetAuthenticatedUser();
    const source = user?.account?.default_version?.data_source?.id || '';
    const baseParams = {
        source,
        validation_status: 'all',
        asLocation: true,
        limit: 3000,
        order: 'id',
        orgUnitParentId: country,
    };
    const districtParam = {
        orgUnitTypeCategory: 'DISTRICT',
    };
    const provinceParam = {
        orgUnitTypeCategory: "REGION",
    };
    const params =
        orgUnitCategory === 'DISTRICT'
            ? { ...baseParams, ...districtParam }
            : { ...baseParams, ...provinceParam };

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
            enabled: Boolean(country),
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
        },
    );
};
