import { patchRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';
import { SyncResponse } from '../types/sync';

type SyncParams = {
    id: number;
};

const createJsonDiffAsync = async ({
    id,
}: SyncParams): Promise<SyncResponse> => {
    return patchRequest(`/api/datasources/sync/${id}/create_json_diff/`, {});
};

export const useCreateJsonDiffAsync = () => {
    return useSnackMutation<SyncResponse, Error, SyncParams>({
        mutationFn: ({ id }) => createJsonDiffAsync({ id }),
        showSucessSnackBar: false,
    });
};
