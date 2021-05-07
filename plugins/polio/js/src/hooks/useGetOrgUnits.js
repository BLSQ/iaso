import { useQuery } from 'react-query';
import { sendRequest } from '../utils/networking';

export const useGetOrgUnits = (parent, source) => {
    const params = {
        parent_id: parent,
        source: source,
        validation_status: 'VALID',
    };

    return useQuery(
        ['orgunits', params],
        () => {
            const queryString = new URLSearchParams(params);

            if (source === undefined) {
                queryString.delete('source');
            }

            return sendRequest(
                'GET',
                '/api/orgunits/?' + queryString.toString(),
            );
        },
        {
            refetchOnWindowFocus: false,
        },
    );
};

export const useGetAllParentsOrgUnits = initialOrgUnit => {
    return useQuery(
        ['orgunits', initialOrgUnit],
        async () => {
            if (initialOrgUnit === 0) {
                return [0];
            }

            const result = await sendRequest(
                'GET',
                '/api/orgunits/' + initialOrgUnit,
            );
            const initialState = [result.id];
            let currentParent = result.parent;
            while (currentParent) {
                initialState.unshift(currentParent.id);
                currentParent = currentParent.parent;
            }

            initialState.unshift(0);

            return initialState;
        },
        {
            refetchOnWindowFocus: false,
        },
    );
};
