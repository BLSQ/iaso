import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';

export const useGetInstances = ({ orgUnitId }) => {
    const params = {
        order: 'id',
    };
    if (orgUnitId) {
        params.orgUnitId = orgUnitId;
    }

    const queryString = new URLSearchParams(params);

    return useSnackQuery(['instances', params], () =>
        getRequest(`/api/instances/?${queryString.toString()}`),
    );
};
