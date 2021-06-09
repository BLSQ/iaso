import { useQuery } from 'react-query';
import { sendRequest } from '../utils/networking';

export const useGetCampaigns = (options) =>{
    // adding the params to the queryKey to make sure it fetches when the query changes
    return useQuery(['polio', 'campaigns', options.page, options.pageSize, options.order], async () =>
    // additional props are WIP
        sendRequest('GET', '/api/polio/campaigns/?limit='+options.pageSize+'&page='+options.page+'&order='+options.order),{cacheTime:0, structuralSharing:false}
);}
