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

export const useGetAllParentsOrgUnits = initialOrgUnit => {
    return useQuery(['org_units_parents', initialOrgUnit], async () => {
        if (initialOrgUnit === 0) {
            return [0];
        }

        let parent = initialOrgUnit;
        const initialState = [initialOrgUnit];
        while (parent !== 0) {
            const result = await sendRequest('GET', '/api/orgunits/' + parent);
            parent = result?.parent_id ?? 0;
            initialState.unshift(parent);
        }

        return initialState;
    });
};
