import React, {
    FC,
    ReactNode,
    createContext,
    useContext,
    useMemo,
} from 'react';
import { LoadingSpinner } from 'bluesquare-components';
import {
    PlanningLevelTreeNode,
    useApiMicroplanningPlanningsOrgunitsLevelTreeList,
} from 'Iaso/api/plannings';
import { useTeamTree } from 'Iaso/domains/teams/components/teamTree/useTeamTree';
import { TeamTreeNode } from 'Iaso/domains/teams/types/team';
import { getTeamChain } from '../components/assignments/utils';
import { useAssignmentsParams } from '../hooks/useAssignmentsParams';
import { Planning } from '../types';

type AssignmentsContextValue = {
    planning: Planning;
    tree: TeamTreeNode;
    expandedTeamIds: Set<number>;
    toggleTeam: (teamId: number) => void;
    // Org units of every planning level, each pointing to its closest ancestor in the level above.
    levelTree: PlanningLevelTreeNode[];
    // From the root team down to the selected team.
    teamChain: TeamTreeNode[];
    selectedTeam: TeamTreeNode;
    // A team works on the level of its depth: level 0 is the target geography of the root team.
    selectedLevel: number;
};

const AssignmentsContext = createContext<AssignmentsContextValue | undefined>(
    undefined,
);

export const useAssignmentsContext = (): AssignmentsContextValue => {
    const context = useContext(AssignmentsContext);
    if (!context) {
        throw new Error(
            'useAssignmentsContext must be used within an AssignmentsProvider',
        );
    }
    return context;
};

type Props = {
    planning: Planning;
    rootTeamId: number;
    children: ReactNode;
};

export const AssignmentsProvider: FC<Props> = ({
    planning,
    rootTeamId,
    children,
}) => {
    const { teamId } = useAssignmentsParams();
    const {
        tree,
        isLoading: isLoadingTree,
        expandedTeamIds,
        toggleTeam,
    } = useTeamTree(rootTeamId);
    const { data: levelTree, isLoading: isLoadingLevelTree } =
        useApiMicroplanningPlanningsOrgunitsLevelTreeList(`${planning.id}`);

    // Falls back to the root team when the team of the url is not in the hierarchy.
    const teamChain = useMemo(() => {
        if (!tree) return [];
        const chain = teamId ? getTeamChain(tree, Number(teamId)) : [];
        return chain.length ? chain : [tree];
    }, [tree, teamId]);

    const value = useMemo(
        () =>
            tree &&
            levelTree && {
                planning,
                tree,
                expandedTeamIds,
                toggleTeam,
                levelTree,
                teamChain,
                selectedTeam: teamChain[teamChain.length - 1],
                selectedLevel: teamChain.length - 1,
            },
        [planning, tree, expandedTeamIds, toggleTeam, levelTree, teamChain],
    );

    if (isLoadingTree || isLoadingLevelTree) return <LoadingSpinner />;
    if (!value) return null;
    return (
        <AssignmentsContext.Provider value={value}>
            {children}
        </AssignmentsContext.Provider>
    );
};
