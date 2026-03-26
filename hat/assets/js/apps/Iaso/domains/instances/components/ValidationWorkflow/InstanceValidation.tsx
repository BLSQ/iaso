import React, { FunctionComponent } from 'react';
import { userHasOneOfRoles } from 'Iaso/domains/users/utils';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import { useGetSubmissionValidationStatus } from './useGetSubmissionValidationStatus';

type Props = { id: number };
export const InstanceValidation: FunctionComponent<Props> = ({ id }) => {
    const currentUser = useCurrentUser();
    const { data, isLoading } = useGetSubmissionValidationStatus(id);
    const canValidate = userHasOneOfRoles(
        currentUser,
        data?.userRoles.map(r => r.value) ?? [],
    );

    return <span>Validation Workflow</span>;
};
