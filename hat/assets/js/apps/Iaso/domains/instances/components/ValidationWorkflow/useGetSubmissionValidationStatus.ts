import { ValidationNodeRetrieveResponse } from 'Iaso/domains/instances/validationWorkflow/types/validationNodes';
import { ValidationWorkflowRetrieveResponseItem } from 'Iaso/domains/instances/validationWorkflow/types/validationWorkflows';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { API_URL } from '../../validationWorkflow/constants';

const getSubmissionValidationStatus = (
    id: number,
): Promise<ValidationNodeRetrieveResponse> => {
    return getRequest(`/api/validation-workflows/instance/${id}/`);
};

export const useGetSubmissionValidationStatus = (id?: number) => {
    return useSnackQuery({
        queryKey: ['submission-validation-status', id],
        queryFn: () => getSubmissionValidationStatus(id!),
        options: {
            staleTime: Infinity,
            cacheTime: Infinity,
            retry: false,
            keepPreviousData: true,
            enabled: Boolean(id),
        },
    });
};

const getNodes = (
    workflowSlug: string,
): Promise<ValidationWorkflowRetrieveResponseItem> => {
    return getRequest(`${API_URL}${workflowSlug}/`);
};

export const useGetNodesList = (workflowSlug?: string) => {
    return useSnackQuery({
        queryKey: ['submission-validation-nodes', workflowSlug], // TODO invalidate on WF save
        queryFn: () => getNodes(workflowSlug!),
        options: {
            staleTime: Infinity,
            cacheTime: Infinity,
            retry: false,
            keepPreviousData: true,
            enabled: Boolean(workflowSlug),
        },
    });
};
