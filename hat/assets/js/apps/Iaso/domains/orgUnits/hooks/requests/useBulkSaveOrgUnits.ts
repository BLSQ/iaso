import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

import { SaveData } from '../../types/saveMulti';

import MESSAGES from '../../messages';

const saveBulkOgrUnits = (data: SaveData) => {
    const url = '/api/tasks/create/orgunitsbulklocationset/';
    return postRequest(url, data);
};

export const useBulkSaveOrgUnits = (
    callback: () => void = () => null,
): UseMutationResult => {
    const onSuccess = () => callback();
    return useSnackMutation({
        mutationFn: saveBulkOgrUnits,
        options: { onSuccess },
        showSucessSnackBar: true,
        snackSuccessMessage: MESSAGES.saveMultiEditOrgUnitsLaunched,
        snackErrorMsg: MESSAGES.saveMultiEditOrgUnitsError,
    });
};
