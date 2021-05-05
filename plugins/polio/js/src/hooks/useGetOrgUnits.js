import { useQuery } from 'react-query';
import { sendRequest } from '../utils/networking';

export const useGetOrgUnits = (parent, source) =>
    useQuery(['polio', 'org_units', parent, source], () => {
        const params = new URLSearchParams(
            `parent_id=${parent}&validation_status=VALID`,
        );

        if (source !== undefined) {
            params.set('source', source);
        }

        return sendRequest('GET', '/api/orgunits/?' + params.toString());
    });
