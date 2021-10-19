import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';

export const useGetInstances = ({ orgUnitId }) => {
    const params = {
        orgUnitId,
        order: 'id',
    };

    const queryString = new URLSearchParams(params);

    return useSnackQuery(['instances', params], () =>
        getRequest(`/api/instances/?${queryString.toString()}`),
    );
};
