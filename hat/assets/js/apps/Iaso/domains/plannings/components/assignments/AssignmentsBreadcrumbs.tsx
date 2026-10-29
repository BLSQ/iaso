import React, { FC, useMemo } from 'react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { BreadcrumbItem, Breadcrumbs } from 'Iaso/components/nav/Breadcrumbs';
import { useAssignmentsContext } from '../../contexts/AssignmentsContext';
import { useAssignmentsParams } from '../../hooks/useAssignmentsParams';

export const AssignmentsBreadcrumbs: FC = () => {
    const { openTeam } = useAssignmentsParams();
    const { teamChain } = useAssignmentsContext();
    const items: BreadcrumbItem[] = useMemo(
        () =>
            teamChain.map(team => ({
                key: team.id,
                label: team.name,
                onClick: () => openTeam(team.id),
            })),
        [teamChain, openTeam],
    );
    return (
        <Breadcrumbs
            items={items}
            separator={<ChevronRightIcon fontSize="small" />}
        />
    );
};
