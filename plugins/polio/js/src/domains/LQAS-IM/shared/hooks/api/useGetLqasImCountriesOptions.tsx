import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { DropdownOptions } from '../../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { useAppId } from '../../../../../../../../../hat/assets/js/apps/Iaso/domains/app/hooks/useAppId';

const API_URL = `/api/polio/lqasim/countries/?order=name`;

const getLqasImCountriesOptions = (isEmbedded: boolean, appId: string) => {
    if (isEmbedded) {
        return getRequest(`${API_URL}&app_id=${appId}`);
    }
    return getRequest(API_URL);
};

export const useGetLqasImCountriesOptions = (
    isEmbedded = false,
): UseQueryResult<DropdownOptions<string>[]> => {
    const appId = useAppId();
    return useSnackQuery({
        queryKey: ['lqasimcountries', isEmbedded, appId],
        queryFn: () => getLqasImCountriesOptions(isEmbedded, appId),
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
