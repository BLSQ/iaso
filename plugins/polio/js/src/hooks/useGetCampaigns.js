import { useQuery } from 'react-query';
import { sendRequest } from '../utils/networking';

export const useGetCampaigns = () => {
    const { data, isLoading } = useQuery(['polio', 'campaigns'], () =>
        sendRequest('GET', '/api/polio/campaigns/'),
    );

    return {
        data,
        isLoading,
    };
};
