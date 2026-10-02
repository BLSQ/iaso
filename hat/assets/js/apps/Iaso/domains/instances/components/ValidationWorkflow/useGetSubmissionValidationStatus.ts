import {
    useCurrentUserHasAccessToModule,
    useCurrentUserHasAllPermissions,
} from 'Iaso/domains/users/utils';
import { ValidationNodeRetrieveResponse } from 'Iaso/domains/validationWorkflowsConfiguration/types/validationNodes';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { VALIDATION_WORKFLOW_MODULE } from 'Iaso/utils/modules';
import { SUBMISSIONS, VALIDATION_WORKFLOWS } from 'Iaso/utils/permissions';

const getSubmissionValidationStatus = (
    id: number,
): Promise<ValidationNodeRetrieveResponse> => {
    return getRequest(`/api/validation-workflows/instance/${id}/`);
};

export const useGetSubmissionValidationStatus = (id?: number) => {
    const hasPermission = useCurrentUserHasAllPermissions([
        VALIDATION_WORKFLOWS,
        SUBMISSIONS,
    ]);
    const userHasModule = useCurrentUserHasAccessToModule(
        VALIDATION_WORKFLOW_MODULE,
    );

    return useSnackQuery({
        queryKey: ['submission-validation-status', id],
        queryFn: () => getSubmissionValidationStatus(id!),
        ignoreErrorCodes: [404],
        options: {
            staleTime: Infinity,
            cacheTime: Infinity,
            retry: false,
            keepPreviousData: true,
            enabled: Boolean(id) && hasPermission && userHasModule,
        },
    });
};
