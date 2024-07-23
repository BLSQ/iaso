import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';

const apiUrl = '/api/links';

export const useGetLinkDetails = (linkId: number) => {
    return useSnackQuery({
        queryKey: ['links', linkId],
        queryFn: () => getRequest(`${apiUrl}/${linkId}`),
        options: {
            keepPreviousData: true,
            cacheTime: 600000,
            staleTime: 600000,
        },
    });
};
