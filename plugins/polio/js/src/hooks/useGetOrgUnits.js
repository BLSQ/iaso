import { useQuery } from 'react-query';
import { sendRequest } from '../utils/networking';

export const useGetOrgUnits = parent =>
    useQuery(['polio', 'org_units', parent], () =>
        sendRequest(
            'GET',
            `/api/orgunits/?&parent_id=${parent}&source=1&validation_status=VALID`,
        ),
    );
