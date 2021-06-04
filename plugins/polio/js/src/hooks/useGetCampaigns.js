import { useQuery } from 'react-query';
import { sendRequest } from '../utils/networking';

export const useGetCampaigns = () =>
    useQuery(['polio', 'campaigns'], () =>
    // TODO parametrize limit & page
        sendRequest('GET', '/api/polio/campaigns/?format=json&limit=2&page=2'),
    );
