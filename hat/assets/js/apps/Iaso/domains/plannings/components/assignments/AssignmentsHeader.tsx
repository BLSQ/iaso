import React, { FC, useCallback, useMemo } from 'react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Stack } from '@mui/material';
import { BreadcrumbItem, Breadcrumbs } from 'Iaso/components/nav/Breadcrumbs';
import { SxStyles } from 'Iaso/types/general';
import { useAssignmentsParams } from '../../hooks/useAssignmentsParams';
import { AssignmentsMode, Planning } from '../../types';
import { HierarchyTeam } from '../teamHierarchy/types';
import { ModeToggle } from './ModeToggle';
import { PublishedPlanningWarning } from './PublishedPlanningWarning';
import { getTeamChain } from './utils';

const styles = {
    breadcrumbs: {
        flex: 1,
        minWidth: 300,
        typography: 'h6',
    },
} satisfies SxStyles;

type Props = {
    planning: Planning;
    teams: HierarchyTeam[];
    scopeTeamId: number;
};

export const AssignmentsHeader: FC<Props> = ({
    planning,
    teams,
    scopeTeamId,
}) => {
    const { mode, updateParams } = useAssignmentsParams();
    const breadcrumbItems: BreadcrumbItem[] = useMemo(
        () =>
            getTeamChain(teams, scopeTeamId).map(team => ({
                key: team.id,
                label: team.name,
                onClick: () => updateParams({ teamId: `${team.id}` }),
            })),
        [teams, scopeTeamId, updateParams],
    );
    const handleChangeMode = useCallback(
        (newMode: AssignmentsMode) => updateParams({ mode: newMode }),
        [updateParams],
    );
    return (
        <Stack gap={2}>
            <Stack direction="row" alignItems="center" gap={2} flexWrap="wrap">
                <Breadcrumbs
                    items={breadcrumbItems}
                    separator={<ChevronRightIcon fontSize="small" />}
                    sx={styles.breadcrumbs}
                />
                <ModeToggle mode={mode} onChange={handleChangeMode} />
            </Stack>
            {mode === 'assign' && planning.status === 'published' && (
                <PublishedPlanningWarning />
            )}
        </Stack>
    );
};
