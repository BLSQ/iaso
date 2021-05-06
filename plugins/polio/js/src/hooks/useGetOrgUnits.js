import { useQuery } from 'react-query';
import { sendRequest } from '../utils/networking';

export const useGetOrgUnits = (parent, source) => {
    const params = {
        parent_id: parent,
        source: source,
        validation_status: 'VALID',
    };

    return useQuery(['org_units', params], () => {
        const queryString = new URLSearchParams(params);

        if (source === undefined) {
            params.delete('source');
        }

        return sendRequest('GET', '/api/orgunits/?' + queryString.toString());
    });
};
