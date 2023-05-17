import { UseMutationResult } from 'react-query';
import { patchRequest, postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

import { OrgunitType } from '../../types/orgunitTypes';

const patchOrgUniType = async (body: Partial<OrgunitType>) => {
    const url = `/api/orgunittypes/${body.id}/`;
    return patchRequest(url, body);
};

const postOrgUnitType = async (body: OrgunitType) => {
    return postRequest({
        url: '/api/orgunittypes/',
        data: body,
    });
};

export const useSaveOrgUnitType = (): UseMutationResult => {
    const ignoreErrorCodes = [400];

    return useSnackMutation({
        mutationFn: (data: Partial<OrgunitType>) =>
            data.id
                ? patchOrgUniType(data)
                : postOrgUnitType(data as OrgunitType),
        invalidateQueryKey: ['paginated-orgunit-types'],
        ignoreErrorCodes,
    });
};
