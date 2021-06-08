import { useQuery } from 'react-query';
import { sendRequest } from '../utils/networking';

export const useGetCampaigns = (page, pageSize, order) =>{
    // adding the params to the queryKey to make sure it fetches when the query changes
    return useQuery(['polio', 'campaigns', page, pageSize, order], async () =>
    // additional props are WIP
        sendRequest('GET', '/api/polio/campaigns/?limit='+pageSize+'&page='+page+'&order='+order),{cacheTime:0, structuralSharing:false}
);}
