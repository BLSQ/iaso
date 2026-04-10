import MESSAGES from '../../../components/snackBars/messages';
import { patchRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';

const reassignInstance = (currentInstance, body) => {
    const effectivePayload = { ...body };
    if (!body.period) delete effectivePayload.period;
    if (!body.org_unit) delete effectivePayload.org_unit;
    if (!body.source_created_at) delete effectivePayload.source_created_at;
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
    source_created_at?: number;
};

export const useReassignInstance = <T extends ReassignInstancePayload>() =>
    useSnackMutation<void, Error, T>({
        mutationFn: ({
            currentInstance,
            period,
            org_unit,
            source_created_at,
        }: T) =>
            reassignInstance(currentInstance, {
                period,
                org_unit,
                source_created_at,
            }),
        snackErrorMsg: MESSAGES.assignInstanceError,
        invalidateQueryKey: ['instance'],
    });
