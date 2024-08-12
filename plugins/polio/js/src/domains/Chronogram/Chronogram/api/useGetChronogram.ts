import { UseBaseQueryResult } from 'react-query';

import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';

import { ChronogramApiResponse, ChronogramParams } from '../types';
import { apiBaseUrl } from '../../constants';

const getChronogram = async (
    params: Partial<ChronogramParams>,
): Promise<ChronogramApiResponse> => {
    const { country, ...paramsWithoutCountry } = params;
    let queryString = new URLSearchParams(paramsWithoutCountry).toString();
    if (country) {
        queryString += `&country=${country.split(',').join('&country=')}`;
    }
    return getRequest(`${apiBaseUrl}?${queryString}&fields=:all`);
};

export const useGetChronogram = (
    params: ChronogramParams,
): UseBaseQueryResult<ChronogramApiResponse, unknown> => {
    // Removed params with an undefined value.
    const cleanedParams: Partial<ChronogramParams> = JSON.parse(
        JSON.stringify(params),
    );
    return useSnackQuery({
        queryKey: ['chronogramList', cleanedParams],
        queryFn: () => getChronogram(cleanedParams),
    });
};
