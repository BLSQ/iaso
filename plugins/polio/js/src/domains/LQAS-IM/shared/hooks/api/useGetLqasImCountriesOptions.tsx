import { UseQueryResult } from 'react-query';
import { useSnackQuery } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { getRequest } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { DropdownOptions } from '../../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { appId } from '../../../../../constants/app';

const API_URL = `/api/polio/lqasim/countries/?order=name`;

const getLqasImCountriesOptions = isEmbedded => {
    if (isEmbedded) {
        return getRequest(`${API_URL}&app_id=${appId}`);
    }
    return getRequest(API_URL);
};

export const useGetLqasImCountriesOptions = (
    isEmbedded = false,
): UseQueryResult<DropdownOptions<string>[]> => {
    return useSnackQuery({
        queryKey: ['lqasimcountries', isEmbedded],
        queryFn: () => getLqasImCountriesOptions(isEmbedded),
        options: {
            select: data =>
                (data?.results ?? []).map(result => ({
                    ...result,
                    value: `${result.value}`,
                })),
            cacheTime: 1000 * 60 * 5,
            staleTime: 1000 * 60 * 15,
        },
    });
};
