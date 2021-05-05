import { useQuery } from 'react-query';
import { sendRequest } from '../utils/networking';

export const useGetOrgUnits = () =>
    useQuery(['polio', 'org_units'], () =>
        sendRequest(
            'GET',
            '/api/orgunits/?&parent_id=0&source=1&validation_status=VALID',
        ),
    );
