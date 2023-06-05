import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

import { SaveData } from '../../types/saveMulti';

import MESSAGES from '../../messages';

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
        await saveBulkOrgUnits(args);
    }
    if (args.saveOtherField) {
        await saveBulkOrgUnitsGPS(args);
    }
};

export const useBulkSaveOrgUnits = (
    callback: () => void = () => null,
): UseMutationResult => {
    const onSuccess = () => callback();
    return useSnackMutation({
        mutationFn: saveMulti,
        options: { onSuccess },
        showSucessSnackBar: true,
        snackSuccessMessage: MESSAGES.saveMultiEditOrgUnitsLaunched,
        snackErrorMsg: MESSAGES.saveMultiEditOrgUnitsError,
    });
};
