import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { CalendarCampaign } from '../../../constants/types';
import { getURL } from '../../Campaigns/hooks/api/useGetCampaigns';

const URL = '/api/polio/v2/calendar/';

const getCampaigns = queryParams => getRequest(getURL(queryParams, URL));

export const useGetCampaigns = ({
    queryParams,
    queryOptions,
}): UseQueryResult<CalendarCampaign[], Error> => {
    return useSnackQuery({
        queryKey: ['calendar-campaigns', queryParams],
        queryFn: () => getCampaigns(queryParams),
        options: {
            cacheTime: Infinity,
            staleTime: Infinity,
            structuralSharing: false,
            refetchOnWindowFocus: false,
            ...queryOptions,
        },
    });
};
