import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { useAppId } from '../../../../../hat/assets/js/apps/Iaso/domains/app/hooks/useAppId';

export const useGetCountries = (status = 'all', enabled = true) => {
    const appId = useAppId();
    const params = {
        validation_status: status,
        order: 'name',
        orgUnitTypeCategory: 'country',
        app_id: appId,
    };

    const queryString = new URLSearchParams(params);

    return useSnackQuery({
        queryKey: ['orgunits', 'countries', status, appId],
        queryFn: () => getRequest(`/api/orgunits/?${queryString.toString()}`),
        options: {
            staleTime: Infinity,
            cacheTime: Infinity,
            enabled,
        },
    });
};
