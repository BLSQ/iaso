import React, { FC, useDeferredValue, useMemo } from 'react';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Stack, Typography } from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from './messages';
import { TeamTreeEditor } from './TeamTreeEditor';
import { TeamTreeRows } from './TeamTreeRows';
import { TeamTreeState } from './useTeamTree';
import { flattenTeamTree, getSearchMatches } from './utils';

const styles = {
    hint: {
        px: 2,
        py: 1,
        borderBottom: 1,
        borderColor: 'divider',
        color: 'text.secondary',
    },
    hintIcon: {
        fontSize: '1rem',
    },
    emptyMessage: {
        p: 2,
    },
} satisfies SxStyles;

type Props = {
    // Result of useTeamTree, shared with the caller so toolbars and counts read the same tree.
    teamTree: TeamTreeState;
    search?: string;
    // Enables drag & drop, row actions and team creation.
    editable?: boolean;
    // Project of the teams created from the tree.
    projectId?: number;
};

export const TeamTree: FC<Props> = ({
    teamTree: {
        rootTeamId,
        tree,
        isLoading,
        expandedTeamIds,
        expandTeam,
        toggleTeam,
    },
    search = '',
    editable = false,
    projectId,
}) => {
    const { formatMessage } = useSafeIntl();
    const deferredSearch = useDeferredValue(search);

    const rows = useMemo(() => {
        if (!tree) return [];
        const visibleKeys = deferredSearch
            ? getSearchMatches(tree, deferredSearch)
            : undefined;
        return flattenTeamTree(tree, expandedTeamIds, visibleKeys);
    }, [tree, deferredSearch, expandedTeamIds]);

    return (
        <>
            {isLoading && <LoadingSpinner absolute fixed={false} />}
            {editable && (
                <Stack
                    direction="row"
                    alignItems="center"
                    gap={1}
                    sx={styles.hint}
                >
                    <DragIndicatorIcon sx={styles.hintIcon} />
                    <Typography variant="caption">
                        {formatMessage(MESSAGES.teamTreeDragHint)}
                    </Typography>
                </Stack>
            )}
            {deferredSearch && rows.length === 0 && (
                <Typography color="text.secondary" sx={styles.emptyMessage}>
                    {formatMessage(MESSAGES.noTeamTreeMatch)}
                </Typography>
            )}
            {editable && tree ? (
                <TeamTreeEditor
                    rootTeamId={rootTeamId}
                    tree={tree}
                    rows={rows}
                    projectId={projectId}
                    showAddTeam={!deferredSearch}
                    expandTeam={expandTeam}
                    toggleTeam={toggleTeam}
                />
            ) : (
                <TeamTreeRows rows={rows} onToggle={toggleTeam} />
            )}
        </>
    );
};
