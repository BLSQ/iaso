import { useQuery } from 'react-query';
import { sendRequest } from '../utils/networking';

export const useGetCampaigns = (query) =>{
    // adding the query to the queryKey to make sure it fetches when the query changes
    return useQuery(['polio', 'campaigns', query], async () =>
    // additional props are WIP
        sendRequest('GET', query),{cacheTime:0, structuralSharing:false}
);}
