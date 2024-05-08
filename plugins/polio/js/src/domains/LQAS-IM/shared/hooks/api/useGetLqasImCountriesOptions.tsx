import { UseQueryResult } from 'react-query';
import { useSnackQuery } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { getRequest } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { DropdownOptions } from '../../../../../../../../../hat/assets/js/apps/Iaso/types/utils';

const getLqasImCountriesOptions = (category: 'lqas' | 'im') => {
    return getRequest(
        `/api/polio/lqasim/countries/?category=${category}&order=name`,
    );
};

export const useGetLqasImCountriesOptions = (
    category: 'lqas' | 'im',
): UseQueryResult<DropdownOptions<string>[]> => {
    return useSnackQuery({
        queryKey: ['lqasimcountries', category],
        queryFn: () => getLqasImCountriesOptions(category),
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
