import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

const usableEndpoint = '/api/polio/dashboards/public/vaccine_stock/get_usable';
const unusableEndpoint =
    '/api/polio/dashboards/public/vaccine_stock/get_unusable';

const getPublicVaccineStock = (queryString = '', usable = true) => {
    const endpoint = usable ? usableEndpoint : unusableEndpoint;
    return getRequest(`${endpoint}/${queryString}`);
};
export const useGetPublicVaccineStock = ({ params, usable }) => {
    return useSnackQuery({
        queryKey: ['public_stock', params, usable],
        queryFn: () => getPublicVaccineStock('', usable),
        options: {
            select: data => {
                return data ?? {};
            },
            keepPreviousData: true,
            cacheTime: 60000,
            staleTime: 60000,
        },
    });
};
