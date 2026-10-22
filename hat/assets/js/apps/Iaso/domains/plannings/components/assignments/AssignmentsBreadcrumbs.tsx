import React, { FC, useMemo } from 'react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { BreadcrumbItem, Breadcrumbs } from 'Iaso/components/nav/Breadcrumbs';
import { TeamTreeNode } from 'Iaso/domains/teams/types/team';
import { useAssignmentsParams } from '../../hooks/useAssignmentsParams';

type Props = {
    teamChain: TeamTreeNode[];
};

export const AssignmentsBreadcrumbs: FC<Props> = ({ teamChain }) => {
    const { openTeam } = useAssignmentsParams();
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
