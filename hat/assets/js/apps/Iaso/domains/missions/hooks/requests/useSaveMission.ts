import { UseMutationResult } from 'react-query';
import { patchRequest, postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { endpoint } from '../../constants';

const postMission = async (body: any) => {
    return postRequest({
        url: endpoint,
        data: body,
    });
};

const patchMission = async (body: any) => {
    return patchRequest(`${endpoint}${body.id}/`, body);
};

export const useSaveMission = (): UseMutationResult => {
    const ignoreErrorCodes = [400];
    return useSnackMutation({
        mutationFn: (data: any) =>
            data.id ? patchMission(data) : postMission(data),
        invalidateQueryKey: ['missionsList'],
        ignoreErrorCodes,
    });
};
