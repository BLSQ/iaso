import { UseBaseQueryResult } from 'react-query';

import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

import { apiBaseUrl } from '../../constants';
import { ChronogramApiResponse, ChronogramParams } from '../types';

const getChronogram = async (
    params: Partial<ChronogramParams>,
): Promise<ChronogramApiResponse> => {
    const { country, campaign, ...newParams } = params;
    let queryString = new URLSearchParams(newParams).toString();
    if (country) {
        queryString += `&country=${country.split(',').join('&country=')}`;
    }
    if (campaign) {
        queryString += `&campaign=${campaign.split(',').join('&campaign=')}`;
    }
    return getRequest(`${apiBaseUrl}/?${queryString}&fields=:all`);
};

export const useGetChronogram = (
    params: ChronogramParams,
): UseBaseQueryResult<ChronogramApiResponse> => {
    // Removed params with an undefined value.
    const cleanedParams: Partial<ChronogramParams> = JSON.parse(
        JSON.stringify(params),
    );
    return useSnackQuery({
        queryKey: ['chronogramList', cleanedParams],
        queryFn: () => getChronogram(cleanedParams),
    });
};
