import { useQuery } from 'react-query';
import { sendRequest } from '../utils/networking';

export const useGetRegionGeoJson = region => {
    const params = {
        source: 6,
        validation_status: 'all',
        asLocation: true,
        limit: 3000,
        order: 'id',
        parent_id: region,
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
            enabled: region !== null,
        },
    );
};
