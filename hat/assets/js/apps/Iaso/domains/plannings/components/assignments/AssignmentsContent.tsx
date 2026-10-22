import React, { FC, useMemo } from 'react';
import { Stack } from '@mui/material';
import { LoadingSpinner } from 'bluesquare-components';
import { GreyPageWrapper } from 'Iaso/components/GreyPageWrapper';
import { useTeamTree } from 'Iaso/domains/teams/components/teamTree/useTeamTree';
import { SxStyles } from 'Iaso/types/general';
import { useAssignmentsParams } from '../../hooks/useAssignmentsParams';
import { Planning } from '../../types';
import { AssignmentsBreadcrumbs } from './AssignmentsBreadcrumbs';
import { ModeToggle } from './ModeToggle';
import { PublishedPlanningWarning } from './PublishedPlanningWarning';
import { TeamsPanel } from './teamsPanel/TeamsPanel';
import { getTeamChain } from './utils';

const styles = {
    fill: {
        flex: 1,
        minHeight: 0,
    },
} satisfies SxStyles;

type Props = {
    planning: Planning;
    rootTeamId: number;
};

export const AssignmentsContent: FC<Props> = ({ planning, rootTeamId }) => {
    const { teamId, mode } = useAssignmentsParams();
    const { tree, isLoading, expandedTeamIds, toggleTeam } =
        useTeamTree(rootTeamId);

    // Falls back to the root team when the team of the url is not in the hierarchy.
    const teamChain = useMemo(() => {
        if (!tree) return [];
        const chain = teamId ? getTeamChain(tree, Number(teamId)) : [];
        return chain.length ? chain : [tree];
    }, [tree, teamId]);

    if (isLoading) return <LoadingSpinner />;
    if (!tree) return null;
    return (
        <GreyPageWrapper
            title={<AssignmentsBreadcrumbs teamChain={teamChain} />}
            actions={<ModeToggle />}
        >
            <Stack gap={2} sx={styles.fill}>
                {mode === 'assign' && planning.status === 'published' && (
                    <PublishedPlanningWarning />
                )}
                <Stack
                    direction="row"
                    flexWrap="wrap"
                    alignItems="stretch"
                    gap={2}
                    sx={styles.fill}
                >
                    <TeamsPanel
                        tree={tree}
                        teamChain={teamChain}
                        expandedTeamIds={expandedTeamIds}
                        onToggleTeam={toggleTeam}
                        targetGeographyName={planning.org_unit_details?.name}
                    />
                </Stack>
            </Stack>
        </GreyPageWrapper>
    );
};
