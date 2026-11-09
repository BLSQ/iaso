import React, { FC, MouseEvent, useCallback } from 'react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Box,
    CircularProgress,
    IconButton,
    Stack,
    Typography,
    alpha,
} from '@mui/material';
import { SxStyles } from 'Iaso/types/general';
import { AssigneeCell } from '../mainPanel/AssigneeCell';
import { Assignee } from '../mainPanel/types';
import { FindOrgUnitRow } from './utils';

const INDENT_SPACING = 2.5;
const TOGGLE_SIZE_PX = 24;

const styles = {
    row: {
        minHeight: 40,
        gap: 0.75,
        pr: 1.5,
        cursor: 'pointer',
        '&:hover': { bgcolor: 'action.hover' },
    },
    selectedRow: theme => ({
        bgcolor: alpha(theme.palette.primary.main, 0.08),
        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.12) },
    }),
    toggle: {
        width: TOGGLE_SIZE_PX,
        height: TOGGLE_SIZE_PX,
        flexShrink: 0,
    },
    loading: {
        width: TOGGLE_SIZE_PX,
        height: TOGGLE_SIZE_PX,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    texts: {
        flex: 1,
        minWidth: 0,
        gap: 1,
    },
    name: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    selectedName: {
        fontWeight: 500,
    },
    type: {
        whiteSpace: 'nowrap',
    },
    assignee: {
        maxWidth: '35%',
        flexShrink: 0,
    },
} satisfies SxStyles;

type ExpandToggleProps = Pick<FindOrgUnitRow, 'isExpanded' | 'hasChildren'> & {
    onClick: (event: MouseEvent) => void;
};

// Children are unknown until the full tree loads: a spinner while it loads after expanding.
const ExpandToggle: FC<ExpandToggleProps> = ({
    isExpanded,
    hasChildren,
    onClick,
}) => {
    if (hasChildren === false) return <Box sx={styles.toggle} />;
    if (isExpanded && hasChildren === undefined) {
        return (
            <Box sx={styles.loading}>
                <CircularProgress size={14} />
            </Box>
        );
    }
    return (
        <IconButton size="small" onClick={onClick} sx={styles.toggle}>
            {isExpanded ? (
                <ExpandMoreIcon fontSize="small" />
            ) : (
                <ChevronRightIcon fontSize="small" />
            )}
        </IconButton>
    );
};

type Props = {
    row: FindOrgUnitRow;
    assignee?: Assignee;
    isSelected: boolean;
    onSelect: (orgUnitId: number) => void;
    onToggle: (orgUnitId: number) => void;
};

export const FindOrgUnitTreeRow: FC<Props> = ({
    row: { orgUnit, depth, isExpanded, hasChildren },
    assignee,
    isSelected,
    onSelect,
    onToggle,
}) => {
    const handleSelect = useCallback(
        () => onSelect(orgUnit.id),
        [onSelect, orgUnit.id],
    );
    const handleToggle = useCallback(
        (event: MouseEvent) => {
            event.stopPropagation();
            onToggle(orgUnit.id);
        },
        [onToggle, orgUnit.id],
    );
    return (
        <Stack
            direction="row"
            alignItems="center"
            onClick={handleSelect}
            aria-selected={isSelected}
            role="option"
            sx={[
                styles.row,
                { pl: 1.5 + depth * INDENT_SPACING },
                isSelected && styles.selectedRow,
            ]}
        >
            <ExpandToggle
                isExpanded={isExpanded}
                hasChildren={hasChildren}
                onClick={handleToggle}
            />
            <Stack direction="row" alignItems="baseline" sx={styles.texts}>
                <Typography
                    variant="body2"
                    sx={[styles.name, isSelected && styles.selectedName]}
                >
                    {orgUnit.name}
                </Typography>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={styles.type}
                >
                    {orgUnit.org_unit_type?.name}
                </Typography>
            </Stack>
            <Box sx={styles.assignee}>
                <AssigneeCell assignee={assignee} />
            </Box>
        </Stack>
    );
};
