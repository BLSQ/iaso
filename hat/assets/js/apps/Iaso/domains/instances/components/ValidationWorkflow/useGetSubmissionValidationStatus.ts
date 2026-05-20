import { userHasAllPermissions } from 'Iaso/domains/users/utils';
import { ValidationNodeRetrieveResponse } from 'Iaso/domains/validationWorkflowsConfiguration/types/validationNodes';
import { ValidationWorkflowRetrieveResponseItem } from 'Iaso/domains/validationWorkflowsConfiguration/types/validationWorkflows';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import {
    hasFeatureFlag,
    SUBMISSION_VALIDATION_WORKFLOW,
} from 'Iaso/utils/featureFlags';
import { SUBMISSIONS, VALIDATION_WORKFLOWS } from 'Iaso/utils/permissions';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import { API_URL } from '../../../validationWorkflowsConfiguration/constants';

const getSubmissionValidationStatus = (
    id: number,
): Promise<ValidationNodeRetrieveResponse> => {
    return getRequest(`/api/validation-workflows/instance/${id}/`);
};

export const useGetSubmissionValidationStatus = (id?: number) => {
    const user = useCurrentUser();
    const hasPermission = userHasAllPermissions(
        [VALIDATION_WORKFLOWS, SUBMISSIONS],
        user,
    );
    const userHasFeatureFlag = hasFeatureFlag(
        user,
        SUBMISSION_VALIDATION_WORKFLOW,
    );

    return useSnackQuery({
        queryKey: ['submission-validation-status', id],
        queryFn: () => getSubmissionValidationStatus(id!),
        options: {
            staleTime: Infinity,
            cacheTime: Infinity,
            retry: false,
            keepPreviousData: true,
            enabled: Boolean(id) && hasPermission && userHasFeatureFlag,
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
