import React, { FC, useCallback, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import {
    Box,
    ButtonBase,
    IconButton,
    Tooltip,
    Typography,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import { useAssignmentsParams } from '../../../hooks/useAssignmentsParams';
import MESSAGES from '../../../messages';
import { FindOrgUnitDialog } from './FindOrgUnitDialog';
import { usePlanningOrgUnitTree } from './usePlanningOrgUnitTree';

const styles = {
    container: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        flex: '0 1 280px',
        minWidth: 200,
    },
    field: {
        width: '100%',
        height: 38,
        justifyContent: 'flex-start',
        gap: 0.75,
        pl: 1.25,
        pr: 1.25,
        border: 1,
        borderColor: 'rgba(0, 0, 0, 0.23)',
        borderRadius: 1,
        bgcolor: 'background.paper',
        '&:hover': { borderColor: 'text.primary' },
    },
    fieldWithClear: {
        pr: 4.75,
    },
    label: {
        flex: 1,
        textAlign: 'left',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    clear: {
        position: 'absolute',
        right: 4,
    },
} satisfies SxStyles;

export const FindOrgUnitField: FC = () => {
    const { formatMessage } = useSafeIntl();
    const { focusOrgUnitId, updateParams } = useAssignmentsParams();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    // Hovering or focusing the field starts loading the full tree, which the dialog needs.
    const [isFullTreeWanted, setIsFullTreeWanted] = useState(false);
    const fullTree = usePlanningOrgUnitTree(
        isFullTreeWanted || isDialogOpen || Boolean(focusOrgUnitId),
    );
    const focusedOrgUnit = focusOrgUnitId
        ? fullTree?.orgUnitById.get(Number(focusOrgUnitId))
        : undefined;

    const wantFullTree = useCallback(() => setIsFullTreeWanted(true), []);
    const openDialog = useCallback(() => setIsDialogOpen(true), []);
    const closeDialog = useCallback(() => setIsDialogOpen(false), []);
    const handleShow = useCallback(
        (orgUnitId: number) => {
            updateParams({ focusOrgUnitId: `${orgUnitId}` });
            setIsDialogOpen(false);
        },
        [updateParams],
    );
    const handleClear = useCallback(
        () => updateParams({ focusOrgUnitId: undefined }),
        [updateParams],
    );

    return (
        <Box sx={styles.container}>
            <ButtonBase
                onClick={openDialog}
                onMouseEnter={wantFullTree}
                onFocus={wantFullTree}
                sx={[
                    styles.field,
                    Boolean(focusedOrgUnit) && styles.fieldWithClear,
                ]}
            >
                <SearchIcon color="action" />
                <Typography
                    variant="body2"
                    color={focusedOrgUnit ? 'text.primary' : 'text.disabled'}
                    sx={styles.label}
                >
                    {focusedOrgUnit?.name ??
                        formatMessage(MESSAGES.findOrgUnit)}
                </Typography>
            </ButtonBase>
            {focusedOrgUnit && (
                <Tooltip title={formatMessage(MESSAGES.clearFoundOrgUnit)}>
                    <IconButton
                        size="small"
                        onClick={handleClear}
                        aria-label={formatMessage(MESSAGES.clearFoundOrgUnit)}
                        sx={styles.clear}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
            {isDialogOpen && (
                <FindOrgUnitDialog
                    initialSelectedId={focusedOrgUnit?.id}
                    onShow={handleShow}
                    onClose={closeDialog}
                />
            )}
        </Box>
    );
};
