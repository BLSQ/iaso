import { UseMutationResult } from 'react-query';
import { patchRequest, postRequest } from '../../../../../libs/Api';
import { useSnackMutation } from '../../../../../libs/apiHooks';

import { apiUrlOUCRC } from '../../constants';
import { OrgUnitChangeRequestConfigurationFull } from '../../types';

const patchOrgUniType = async (body: Partial<OrgUnitChangeRequestConfigurationFull>) => {
    const url = `${apiUrlOUCRC}${body.id}/`;
    return patchRequest(url, body);
};

const postOrgUnitType = async (body: OrgUnitChangeRequestConfigurationFull) => {
    return postRequest({
        url: `${apiUrlOUCRC}`,
        data: body,
    });
};

export const useSaveOrgUnitChangeRequestConfiguration = (): UseMutationResult => {
    const ignoreErrorCodes = [400];
    return useSnackMutation({
        mutationFn: (data: Partial<OrgUnitChangeRequestConfigurationFull>) =>
            data.id
                ? patchOrgUniType(data)
                : postOrgUnitType(data as OrgUnitChangeRequestConfigurationFull),
        // invalidateQueryKey: ['paginated-orgunit-types'],
        ignoreErrorCodes,
    });
};
