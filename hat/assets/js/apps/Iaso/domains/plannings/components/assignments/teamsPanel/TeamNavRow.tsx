import React, { FC, MouseEvent, useCallback, useEffect, useRef } from 'react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, IconButton, alpha } from '@mui/material';
import { TeamTypeIcon } from 'Iaso/domains/teams/components/teamTree/teamType';
import { SxStyles } from 'Iaso/types/general';
import { INDENT_PX, TeamsPanelRowLayout } from './TeamsPanelRowLayout';
import { TeamNavRowData } from './types';

const styles = {
    row: {
        minHeight: 40,
        gap: 0.75,
        pr: 1.25,
    },
    scopeRow: theme => ({
        bgcolor: alpha(theme.palette.primary.main, 0.08),
        borderLeftColor: theme.palette.primary.main,
    }),
    toggle: {
        width: 22,
        height: 22,
        p: 0,
        flexShrink: 0,
    },
    toggleSpacer: {
        width: 22,
        flexShrink: 0,
    },
    icon: {
        fontSize: 18,
        color: 'text.secondary',
        flexShrink: 0,
    },
    scopeIcon: {
        color: 'primary.main',
    },
    scopeName: {
        color: 'primary.main',
        fontWeight: 500,
    },
} satisfies SxStyles;

type Props = {
    row: TeamNavRowData;
    caption?: string;
    onOpen: (teamId: number) => void;
    onToggle: (teamId: number) => void;
};

export const TeamNavRow: FC<Props> = ({
    row: { team, depth, isScope, isExpanded, isExpandable },
    caption,
    onOpen,
    onToggle,
}) => {
    const rowRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (isScope) rowRef.current?.scrollIntoView({ block: 'nearest' });
    }, [isScope]);

    const handleOpen = useCallback(() => onOpen(team.id), [onOpen, team.id]);
    const handleToggle = useCallback(
        (event: MouseEvent) => {
            event.stopPropagation();
            onToggle(team.id);
        },
        [onToggle, team.id],
    );

    return (
        <TeamsPanelRowLayout
            ref={rowRef}
            paddingLeft={10 + depth * INDENT_PX}
            guideLevels={depth}
            onClick={isScope ? undefined : handleOpen}
            sx={[styles.row, isScope && styles.scopeRow]}
            leading={
                <>
                    {isExpandable ? (
                        <IconButton
                            size="small"
                            onClick={handleToggle}
                            sx={styles.toggle}
                        >
                            {isExpanded ? (
                                <ExpandMoreIcon fontSize="small" />
                            ) : (
                                <ChevronRightIcon fontSize="small" />
                            )}
                        </IconButton>
                    ) : (
                        <Box sx={styles.toggleSpacer} />
                    )}
                    <TeamTypeIcon
                        type={team.type}
                        sx={[styles.icon, isScope && styles.scopeIcon]}
                    />
                </>
            }
            name={team.name}
            nameSx={isScope ? styles.scopeName : undefined}
            caption={caption}
        />
    );
};
