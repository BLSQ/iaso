import MESSAGES from '../../../components/snackBars/messages';
import { patchRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';

const reassignInstance = (currentInstance, body) => {
    const effectivePayload = { ...body };
    if (!body.period) delete effectivePayload.period;
    return patchRequest(
        `/api/instances/${currentInstance.id}/`,
        effectivePayload,
    );
};

export type ReassignInstancePayload = {
    currentInstance: {
        id: number;
        period?: string;
        org_unit?: any;
    };
    period?: string;
    org_unit?: number;
};

export const useReassignInstance = <T extends ReassignInstancePayload>() =>
    useSnackMutation<void, Error, T>({
        mutationFn: ({ currentInstance, period, org_unit }: T) =>
            reassignInstance(currentInstance, { period, org_unit }),
        snackErrorMsg: MESSAGES.assignInstanceError,
        invalidateQueryKey: ['instance'],
    });
