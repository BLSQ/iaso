import { patchRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';
import { SyncResponse } from '../types/sync';

type SyncParams = {
    id: number;
};

const launchDiff = async ({ id }: SyncParams): Promise<SyncResponse> => {
    return patchRequest(
        `/api/datasources/sync/${id}/synchronize_source_versions_async/`,
        {},
    );
};

export const useLaunchDiff = () => {
    return useSnackMutation<SyncResponse, Error, SyncParams>({
        mutationFn: ({ id }) => launchDiff({ id }),
        showSuccessSnackBar: false,
    });
};
