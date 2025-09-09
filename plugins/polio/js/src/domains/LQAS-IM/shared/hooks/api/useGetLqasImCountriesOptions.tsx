import { UseQueryResult } from 'react-query';
import { useSnackQuery } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { getRequest } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { DropdownOptions } from '../../../../../../../../../hat/assets/js/apps/Iaso/types/utils';

const getLqasImCountriesOptions = () => {
    return getRequest(`/api/polio/lqasim/countries/?order=name`);
};

export const useGetLqasImCountriesOptions = (): UseQueryResult<
    DropdownOptions<string>[]
> => {
    return useSnackQuery({
        queryKey: ['lqasimcountries'],
        queryFn: () => getLqasImCountriesOptions(),
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
