import { UseMutationResult } from 'react-query';
import { putRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { waitFor } from '../../../../utils';

const apiUrl = '/api/algorithmsruns/0/';

const launchAlgo = async body => {
    await waitFor(2000);
    return putRequest(apiUrl, body);
};

export const useLaunchAlgorithmRun = (): UseMutationResult<any> => {
    return useSnackMutation({
        mutationFn: launchAlgo,
        invalidateQueryKey: 'algos',
    });
};
