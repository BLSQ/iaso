import { useApiParams } from '../../../hooks/useApiParams';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';

const defaultTableParams = {
    page: 1,
    limit: 20,
    order: '-version_id',
};

const apiUrl = '/api/formversions';
export const useGetFormVersions = ({ formId, params }) => {
    const { order, page, pageSize } = params;
    const apiParams = useApiParams(
        { form_id: formId, order, page, pageSize },
        defaultTableParams,
    );
    const queryString = new URLSearchParams(apiParams).toString();
    return useSnackQuery({
        queryKey: ['formVersions', formId, queryString],
        queryFn: () => getRequest(`${apiUrl}/?${queryString}`),
        options: {
            keepPreviousData: true,
            staleTime: 60000,
            cacheTime: 60000,
        },
    });
};
