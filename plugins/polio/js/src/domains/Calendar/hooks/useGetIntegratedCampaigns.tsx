import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';

const URL = '/api/polio/v2/integratedcampaigns/';

const getIntegratedCampaigns = (obrNames: string[]) =>
    getRequest(`${URL}?obr_names=${obrNames}`);

export const useGetIntegratedCampaigns = ({
    enabled,
    obrNames,
}: {
    enabled: boolean;
    obrNames: string[];
}) => {
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
