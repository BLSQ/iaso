import { useQuery } from 'react-query';
import { sendRequest } from '../utils/networking';

export const useGetCampaigns = () =>
    useQuery(['polio', 'campaigns'], () =>
        sendRequest('GET', '/api/polio/campaigns/'),
    );
