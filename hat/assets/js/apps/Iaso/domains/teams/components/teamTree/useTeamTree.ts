import { useCallback, useState } from 'react';
import { useGetTeamTree } from '../../hooks/requests/useGetTeamTree';
import { collectTeamIds } from '../../utils';

export type TeamTreeState = ReturnType<typeof useTeamTree>;

export const useTeamTree = (rootTeamId: number) => {
    const { data: tree, isLoading } = useGetTeamTree(rootTeamId);
    const [expandedTeamIds, setExpandedTeamIds] = useState(
        () => new Set([rootTeamId]),
    );
    const expandTeam = useCallback(
        (teamId: number) =>
            setExpandedTeamIds(previous => new Set(previous).add(teamId)),
        [],
    );
    const toggleTeam = useCallback((teamId: number) => {
        setExpandedTeamIds(previous => {
            const next = new Set(previous);
            if (!next.delete(teamId)) next.add(teamId);
            return next;
        });
    }, []);
    const expandAll = useCallback(() => {
        if (tree) setExpandedTeamIds(new Set(collectTeamIds(tree)));
    }, [tree]);
    const collapseAll = useCallback(
        () => setExpandedTeamIds(new Set([rootTeamId])),
        [rootTeamId],
    );
    return {
        rootTeamId,
        tree,
        isLoading,
        expandedTeamIds,
        expandTeam,
        toggleTeam,
        expandAll,
        collapseAll,
    };
};
