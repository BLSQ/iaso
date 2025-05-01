import { postRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';
import { SyncResponse } from '../types/sync';

type SyncParams = {
    name?: string;
    toUpdateSourceVersionId?: number;
    toCompareWithSourceVersionId?: number;
};

const createDataSourceVersionsSync = async ({
    name,
    toUpdateSourceVersionId,
    toCompareWithSourceVersionId,
}: SyncParams): Promise<SyncResponse> => {
    return postRequest('/api/datasources/sync/', {
        name,
        source_version_to_update: toUpdateSourceVersionId,
        source_version_to_compare_with: toCompareWithSourceVersionId,
    });
};

export const useCreateDataSourceVersionsSync = () => {
    return useSnackMutation<SyncResponse, Error, SyncParams>({
        mutationFn: ({
            name,
            toUpdateSourceVersionId,
            toCompareWithSourceVersionId,
        }) =>
            createDataSourceVersionsSync({
                name,
                toUpdateSourceVersionId,
                toCompareWithSourceVersionId,
            }),
        showSucessSnackBar: false,
    });
};
