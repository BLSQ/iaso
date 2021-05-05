import { useQuery } from 'react-query';
import { sendRequest } from '../utils/networking';

export const useGetOrgUnits = level =>
    useQuery(['polio', 'org_units'], () =>
        sendRequest(
            'GET',
            `/api/orgunits/?&parent_id=${level}&source=1&validation_status=VALID`,
        ),
    );
