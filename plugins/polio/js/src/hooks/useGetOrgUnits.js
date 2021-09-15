import { useQuery } from 'react-query';
import { sendRequest } from '../utils/networking';

export const useGetOrgUnit = OrgUnitId => {
    return useQuery(
        ['orgunits', OrgUnitId],
        async () => sendRequest('GET', `/api/orgunits/${OrgUnitId}/`),
        {
            enabled: OrgUnitId !== undefined && OrgUnitId !== null,
        },
    );
};
