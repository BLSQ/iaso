import React, {
    FC,
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';
import { LoadingSpinner } from 'bluesquare-components';
import { useTeamTree } from 'Iaso/domains/teams/components/teamTree/useTeamTree';
import { TeamTreeNode } from 'Iaso/domains/teams/types/team';
import {
    AssigneePick,
    TeamMember,
    getCurrentAssignee,
    getTeamChain,
    getTeamMembers,
} from '../components/assignments/utils';
import { useAssignmentsParams } from '../hooks/useAssignmentsParams';
import { Planning } from '../types';

type AssignmentsContextValue = {
    planning: Planning;
    tree: TeamTreeNode;
    expandedTeamIds: Set<number>;
    toggleTeam: (teamId: number) => void;
    // From the root team down to the selected team.
    teamChain: TeamTreeNode[];
    selectedTeam: TeamTreeNode;
    // A team works on the level of its depth: level 0 is the target geography of the root team.
    selectedLevel: number;
    selectedTeamMembers: TeamMember[];
    // The member that assign mode gives org units to.
    currentAssignee?: TeamMember;
    pickAssignee: (memberKey: string) => void;
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

    // Falls back to the root team when the team of the url is not in the hierarchy.
    const teamChain = useMemo(() => {
        if (!tree) return [];
        const chain = teamId ? getTeamChain(tree, Number(teamId)) : [];
        return chain.length ? chain : [tree];
    }, [tree, teamId]);
    const selectedTeam = teamChain.at(-1);
    const selectedTeamMembers = useMemo(
        () => (selectedTeam ? getTeamMembers(selectedTeam) : []),
        [selectedTeam],
    );

    const [assigneePick, setAssigneePick] = useState<AssigneePick>();
    const pickAssignee = useCallback(
        (memberKey: string) => {
            if (selectedTeam) {
                setAssigneePick({ teamId: selectedTeam.id, memberKey });
            }
        },
        [selectedTeam],
    );
    const currentAssignee = useMemo(
        () =>
            selectedTeam &&
            getCurrentAssignee(selectedTeam, selectedTeamMembers, assigneePick),
        [selectedTeam, selectedTeamMembers, assigneePick],
    );

    const value = useMemo(
        () =>
            tree &&
            selectedTeam && {
                planning,
                tree,
                expandedTeamIds,
                toggleTeam,
                teamChain,
                selectedTeam,
                selectedLevel: teamChain.length - 1,
                selectedTeamMembers,
                currentAssignee,
                pickAssignee,
            },
        [
            planning,
            tree,
            expandedTeamIds,
            toggleTeam,
            teamChain,
            selectedTeam,
            selectedTeamMembers,
            currentAssignee,
            pickAssignee,
        ],
    );

    if (isLoadingTree) return <LoadingSpinner />;
    if (!value) return null;
    return (
        <AssignmentsContext.Provider value={value}>
            {children}
        </AssignmentsContext.Provider>
    );
};
