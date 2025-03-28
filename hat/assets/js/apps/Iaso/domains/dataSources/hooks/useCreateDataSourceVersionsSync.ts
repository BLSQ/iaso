import { postRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';
import { SyncResponse } from '../types/sync';

type SyncParams = {
    name: string | undefined;
    refSourceVersionId: number;
    targetSourceVersionId: number;
};

const createDataSourceVersionsSync = async ({
    name,
    refSourceVersionId,
    targetSourceVersionId,
}: SyncParams): Promise<SyncResponse> => {
    return postRequest('/api/datasources/sync/', {
        name,
        source_version_to_update: refSourceVersionId,
        source_version_to_compare_with: targetSourceVersionId,
    });
};

export const useCreateDataSourceVersionsSync = () => {
    return useSnackMutation<SyncResponse, Error, SyncParams>({
        mutationFn: ({ name, refSourceVersionId, targetSourceVersionId }) =>
            createDataSourceVersionsSync({
                name,
                refSourceVersionId,
                targetSourceVersionId,
            }),
        showSucessSnackBar: false,
    });
};
