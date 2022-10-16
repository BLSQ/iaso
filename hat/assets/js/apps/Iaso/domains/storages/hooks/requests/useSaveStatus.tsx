/* eslint-disable camelcase */
import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../../libs/Api';

import { useSnackMutation } from '../../../../libs/apiHooks';

import { StorageStatus } from '../../types/storages';

type QueryData = {
    storage_id: string;
    storage_type: string;
    storage_status: StorageStatus;
};

export const useSaveStatus = (closeDialog: () => void): UseMutationResult =>
    useSnackMutation({
        mutationFn: (data: QueryData) => {
            console.log('data', data);
            return postRequest(' /api/storage/blacklisted/', data);
        },
        invalidateQueryKey: ['storageLog'],
        options: { onSuccess: () => closeDialog() },
    });
