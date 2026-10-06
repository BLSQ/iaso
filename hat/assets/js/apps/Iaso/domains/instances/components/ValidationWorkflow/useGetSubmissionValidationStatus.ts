import {
    userHasAccessToModule,
    userHasAllPermissions,
} from 'Iaso/domains/users/utils';
import { ValidationNodeRetrieveResponse } from 'Iaso/domains/validationWorkflowsConfiguration/types/validationNodes';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { VALIDATION_WORKFLOW_MODULE } from 'Iaso/utils/modules';
import { SUBMISSIONS } from 'Iaso/utils/permissions';
import { useCurrentUser } from 'Iaso/utils/usersUtils';

const getSubmissionValidationStatus = (
    id: number,
): Promise<ValidationNodeRetrieveResponse> => {
    return getRequest(`/api/validation-workflows/instance/${id}/`);
};

export const useGetSubmissionValidationStatus = (id?: number) => {
    const user = useCurrentUser();
    const hasPermission = userHasAllPermissions([SUBMISSIONS], user);
    const userHasModule = userHasAccessToModule(
        VALIDATION_WORKFLOW_MODULE,
        user,
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
