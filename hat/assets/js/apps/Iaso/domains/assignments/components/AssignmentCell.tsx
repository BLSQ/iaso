import React, { ReactElement } from 'react';
import { textPlaceholder } from 'bluesquare-components';
import { PaginatedAssignment } from 'Iaso/domains/plannings/types';
import { TeamChip } from 'Iaso/domains/teams/components/TeamChip';
import { UserChip } from 'Iaso/domains/users/components/UserChip';

type Props = {
    value: PaginatedAssignment | null;
};

export const AssignmentCell = ({ value: assignment }: Props): ReactElement => {
    if (assignment?.user) {
        return <UserChip user={assignment?.user} />;
    }
    if (assignment?.team) {
        return <TeamChip team={assignment?.team} />;
    }
    return <span>{textPlaceholder}</span>;
};
