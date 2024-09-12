import { UseMutationResult } from 'react-query';
import { useSnackMutation } from '../../../../../libs/apiHooks';

import { apiUrl } from '../../constants';
import { OrgUnitChangeRequestConfig } from '../../types';
import { deleteRequest } from '../../../../../libs/Api';

const deleteOrgUnitChangeRequestConfigs = (config: OrgUnitChangeRequestConfig) => {
    return deleteRequest(`${apiUrl}/${config.id}/`) as Promise<boolean>;
};

export const useDeleteOrgUnitChangeRequestConfig = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: deleteOrgUnitChangeRequestConfigs,
        invalidateQueryKey: 'getOrgUnitChangeRequestConfigs',
    });
