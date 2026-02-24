import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { IntegratedCampaignAPIResponse } from '../campaignCalendar/types';

const URL = '/api/polio/v2/integratedcampaigns/';

const getIntegratedCampaigns = (obrNames: string[]) =>
    getRequest(`${URL}?obr_names=${obrNames}`);

type Args = {
    enabled: boolean;
    obrNames: string[];
};

export const useGetIntegratedCampaigns = ({
    enabled,
    obrNames,
}: Args): UseQueryResult<IntegratedCampaignAPIResponse[], Error> => {
    return useSnackQuery({
        queryKey: ['integrated-campaigns', obrNames],
        queryFn: () => getIntegratedCampaigns(obrNames),
        options: {
            cacheTime: Infinity,
            staleTime: Infinity,
            structuralSharing: false,
            refetchOnWindowFocus: false,
            enabled: enabled && obrNames.length > 0,
        },
    });
};
