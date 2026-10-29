import React, { FC, useMemo, useState } from 'react';
import { Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { numericValues } from 'Iaso/domains/instances/utils/intl';
import TEAM_TREE_MESSAGES from 'Iaso/domains/teams/components/teamTree/messages';
import { TeamTree } from 'Iaso/domains/teams/components/teamTree/TeamTree';
import { TeamTreeToolbar } from 'Iaso/domains/teams/components/teamTree/TeamTreeToolbar';
import { useTeamTree } from 'Iaso/domains/teams/components/teamTree/useTeamTree';
import { countTeamsAndUsers } from 'Iaso/domains/teams/utils';
import { usePlanningContext } from '../../contexts/PlanningContext';
import MESSAGES from '../../messages';
import { PlanningStepCard } from '../shared/PlanningStepCard';

type Props = {
    rootTeamId: number;
    projectId?: number;
};

const TeamHierarchy: FC<Props> = ({ rootTeamId, projectId }) => {
    const { formatMessage } = useSafeIntl();
    const teamTree = useTeamTree(rootTeamId);
    const { tree } = teamTree;
    const [search, setSearch] = useState('');

    const { teamsCount, usersCount } = useMemo(
        () =>
            tree ? countTeamsAndUsers(tree) : { teamsCount: 0, usersCount: 0 },
        [tree],
    );

    return (
        <PlanningStepCard
            step={2}
            title={formatMessage(MESSAGES.teamHierarchy)}
            description={[
                formatMessage(MESSAGES.teamHierarchyInfos),
                formatMessage(
                    TEAM_TREE_MESSAGES.teamsCount,
                    numericValues({ count: teamsCount }),
                ),
                formatMessage(
                    TEAM_TREE_MESSAGES.usersCount,
                    numericValues({ count: usersCount }),
                ),
            ].join(' · ')}
            actions={
                <TeamTreeToolbar
                    search={search}
                    onSearchChange={setSearch}
                    onExpandAll={teamTree.expandAll}
                    onCollapseAll={teamTree.collapseAll}
                />
            }
            disableContentPadding
        >
            <TeamTree
                teamTree={teamTree}
                search={search}
                projectId={projectId}
                editable
            />
        </PlanningStepCard>
    );
};

export const TeamHierarchySection: FC = () => {
    const { formik } = usePlanningContext();
    const { formatMessage } = useSafeIntl();
    const { selectedTeam, project } = formik.values;

    if (!selectedTeam) {
        return (
            <PlanningStepCard
                step={2}
                title={formatMessage(MESSAGES.teamHierarchy)}
            >
                <Typography color="text.secondary">
                    {formatMessage(MESSAGES.selectRootTeamFirst)}
                </Typography>
            </PlanningStepCard>
        );
    }
    // Keyed so expansion and search reset when the root team changes.
    return (
        <TeamHierarchy
            key={selectedTeam}
            rootTeamId={selectedTeam}
            projectId={project}
        />
    );
};
