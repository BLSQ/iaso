import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

import MESSAGES from '../../messages';
import { SaveData } from '../../types/saveMulti';

const saveBulkOrgUnits = (data: SaveData) => {
    const url = '/api/tasks/create/orgunitsbulkupdate/';
    return postRequest(url, data);
};

const saveBulkOrgUnitsGPS = (data: SaveData) => {
    const url = '/api/tasks/create/orgunitsbulklocationset/';
    return postRequest(url, data);
};

type SaveDataWithOptions = SaveData & {
    saveGPS: boolean;
    saveOtherField: boolean;
};

const saveMulti = async (args: SaveDataWithOptions): Promise<void> => {
    if (args.saveGPS) {
        await saveBulkOrgUnitsGPS(args);
    }
    if (args.saveOtherField) {
        await saveBulkOrgUnits(args);
    }
};

export const useBulkSaveOrgUnits = (
    callback: () => void = () => null,
): UseMutationResult => {
    const onSuccess = () => callback();
    return useSnackMutation({
        mutationFn: saveMulti,
        options: { onSuccess },
        showSuccessSnackBar: true,
        snackSuccessMessage: MESSAGES.saveMultiEditOrgUnitsLaunched,
        snackErrorMsg: MESSAGES.saveMultiEditOrgUnitsError,
    });
};
