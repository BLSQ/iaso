import { UseMutationResult } from 'react-query';
import { deleteRequest } from '../../../../../libs/Api';
import { useSnackMutation } from '../../../../../libs/apiHooks';

import { apiUrlOUCRC } from '../../constants';
import { OrgUnitChangeRequestConfigurationFull } from '../../types';

const deleteOrgUnitChangeRequestConfigs = (
    config: OrgUnitChangeRequestConfigurationFull,
) => {
    return deleteRequest(`${apiUrlOUCRC}${config.id}/`) as Promise<boolean>;
};

export const useDeleteOrgUnitChangeRequestConfig = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: deleteOrgUnitChangeRequestConfigs,
        invalidateQueryKey: [
            'useRetrieveOrgUnitChangeRequestConfig',
            'getOrgUnitChangeRequestConfigs',
            'checkAvailabilityOrgUnitChangeRequestConfigs',
        ],
    });
