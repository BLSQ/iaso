import React, { FC, useCallback, useMemo, useState } from 'react';
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
import { openSnackBar } from 'Iaso/components/snackBars/EventDispatcher';
import { errorSnackBar } from 'Iaso/constants/snackBars';
import { SxStyles } from 'Iaso/types/general';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import { useAssignmentsParams } from '../../../hooks/useAssignmentsParams';
import MESSAGES from '../../../messages';
import { usePlanningAssignments } from '../api/usePlanningAssignments';
import { getTeamIdByOrgUnitId } from '../mainPanel/utils';
import { usePlanningOrgUnits } from '../usePlanningOrgUnitTree';
import { FindOrgUnitDialog } from './FindOrgUnitDialog';
import { getOrgUnitChain, locateOrgUnit } from './utils';

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
    const { planning, tree } = useAssignmentsContext();
    const { data: assignments } = usePlanningAssignments(planning.id);
    // Same org units as the dialog, which can only pick loaded ones.
    const { orgUnits } = usePlanningOrgUnits(0, 2);
    const focusedOrgUnit = focusOrgUnitId
        ? orgUnits?.orgUnitById.get(Number(focusOrgUnitId))
        : undefined;
    const teamIdByOrgUnitId = useMemo(
        () => getTeamIdByOrgUnitId(assignments ?? []),
        [assignments],
    );

    const openDialog = useCallback(() => setIsDialogOpen(true), []);
    const closeDialog = useCallback(() => setIsDialogOpen(false), []);
    const handleShow = useCallback(
        (orgUnitId: number) => {
            const located =
                orgUnits &&
                locateOrgUnit(
                    getOrgUnitChain(orgUnits.orgUnitById, orgUnitId),
                    tree,
                    teamIdByOrgUnitId,
                );
            if (!located) {
                openSnackBar(
                    errorSnackBar(undefined, MESSAGES.findOrgUnitError),
                );
                return;
            }
            updateParams({
                teamId: `${located.teamId}`,
                focusOrgUnitId: `${located.shownOrgUnitId}`,
            });
            setIsDialogOpen(false);
        },
        [orgUnits, tree, teamIdByOrgUnitId, updateParams],
    );
    const handleClear = useCallback(
        () => updateParams({ focusOrgUnitId: undefined }),
        [updateParams],
    );

    return (
        <Box sx={styles.container}>
            <ButtonBase
                onClick={openDialog}
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
