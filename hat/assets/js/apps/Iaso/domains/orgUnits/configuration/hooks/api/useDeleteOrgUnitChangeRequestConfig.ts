import { UseMutationResult } from 'react-query';
import { useSnackMutation } from '../../../../../libs/apiHooks';

import { apiUrlOUCRC } from '../../constants';
import { OrgUnitChangeRequestConfigurationFull } from '../../types';
import { deleteRequest } from '../../../../../libs/Api';

const deleteOrgUnitChangeRequestConfigs = (
    config: OrgUnitChangeRequestConfigurationFull,
) => {
    return deleteRequest(`${apiUrlOUCRC}/${config.id}/`) as Promise<boolean>;
};

export const useDeleteOrgUnitChangeRequestConfig = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: deleteOrgUnitChangeRequestConfigs,
        invalidateQueryKey: 'getOrgUnitChangeRequestConfigs',
    });
