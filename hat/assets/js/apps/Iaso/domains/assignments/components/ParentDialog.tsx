import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions,
    Button,
    Box,
    Divider,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl, Table } from 'bluesquare-components';
import React, {
    FunctionComponent,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from 'react';

import { ChildrenOrgUnits } from '../types/orgUnit';
import { SubTeam, User, DropdownTeamsOptions, Team } from '../types/team';
import { SaveAssignmentQuery } from '../types/assigment';
import { Profile } from '../../../utils/usersUtils';
import { Planning } from '../types/planning';

import { useColumns } from '../configs/ParentDialogColumns';

import { getTeamUserName, getMultiSaveParams } from '../utils';

import MESSAGES from '../messages';
import { ParentOrgUnit } from '../../orgUnits/types/orgUnit';
import { getStickyTableHeadStyles } from '../../../styles/utils';

type Props = {
    currentTeam: Team | undefined;
    teams: DropdownTeamsOptions[];
    profiles: Profile[];
    childrenOrgunits: ChildrenOrgUnits | undefined;
    parentSelected: ParentOrgUnit | undefined;
    // eslint-disable-next-line no-unused-vars
    setParentSelected: (orgUnit: ParentOrgUnit | undefined) => void;
    selectedItem: SubTeam | User | undefined;
    planning: Planning | undefined;
    isFetchingChildrenOrgunits: boolean;
    // eslint-disable-next-line no-unused-vars
    saveMultiAssignments: (params: SaveAssignmentQuery) => void;
};
const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    paper: {
        overflow: 'hidden',
    },
    content: {
        padding: '0 !important',
        '& .MuiSpeedDial-root': {
            display: 'none',
        },
    },
}));

export const ParentDialog: FunctionComponent<Props> = ({
    childrenOrgunits,
    parentSelected,
    selectedItem,
    currentTeam,
    teams,
    profiles,
    planning,
    saveMultiAssignments,
    setParentSelected,
    isFetchingChildrenOrgunits,
}) => {
    const { formatMessage } = useSafeIntl();
    const [orgUnitsToUpdate, setOrgUnitsToUpdate] = useState<Array<number>>([]);

    const mode: 'UNASSIGN' | 'ASSIGN' = useMemo(
        () =>
            childrenOrgunits?.orgUnitsToUpdate.length === 0
                ? 'UNASSIGN'
                : 'ASSIGN',
        [childrenOrgunits?.orgUnitsToUpdate],
    );

    const columns = useColumns({
        orgUnitsToUpdate,
        setOrgUnitsToUpdate,
        selectedItem,
        mode,
    });
    const classes: Record<string, string> = useStyles();
    const open = Boolean(parentSelected);

    useEffect(() => {
        if (childrenOrgunits) {
            if (mode === 'ASSIGN') {
                setOrgUnitsToUpdate(childrenOrgunits.orgUnitsToUpdate);
            }
            if (mode === 'UNASSIGN') {
                setOrgUnitsToUpdate(
                    childrenOrgunits.orgUnits.map(orgUnit => orgUnit.id),
                );
            }
        }
    }, [childrenOrgunits, mode]);

    const handleSave = async (): Promise<void> => {
        setParentSelected(undefined);
        if (selectedItem && planning && childrenOrgunits) {
            await saveMultiAssignments(
                getMultiSaveParams({
                    currentType: currentTeam?.type,
                    selectedItem,
                    planning,
                    orgUnitsToUpdate,
                    mode,
                }),
            );
        }
    };

    const closeDialog = useCallback(() => {
        setParentSelected(undefined);
    }, [setParentSelected]);

    if (!open) return null;

    return (
        <Dialog
            fullWidth
            maxWidth="sm"
            open
            classes={{
                paper: classes.paper,
            }}
            onClose={(_, reason) => {
                if (reason === 'backdropClick') {
                    closeDialog();
                }
            }}
            data-test=""
        >
            {childrenOrgunits && (
                <>
                    <DialogTitle>
                        {mode === 'ASSIGN' &&
                            formatMessage(MESSAGES.parentDialogTitle, {
                                assignmentCount: orgUnitsToUpdate.length,
                                parentOrgUnitName: getTeamUserName(
                                    selectedItem,
                                    currentTeam,
                                    profiles,
                                    teams,
                                ),
                            })}
                        {mode === 'UNASSIGN' &&
                            formatMessage(MESSAGES.parentDialogTitleUnsassign, {
                                assignmentCount: orgUnitsToUpdate.length,
                                parentOrgUnitName: getTeamUserName(
                                    selectedItem,
                                    currentTeam,
                                    profiles,
                                    teams,
                                ),
                            })}
                    </DialogTitle>
                </>
            )}
            <DialogContent className={classes.content}>
                <Box sx={getStickyTableHeadStyles('70vh')}>
                    <Divider />
                    {/* @ts-ignore */}
                    <Table
                        elevation={0}
                        data={childrenOrgunits?.orgUnits || []}
                        showPagination={false}
                        defaultSorted={[{ id: 'name', desc: false }]}
                        countOnTop={false}
                        marginTop={false}
                        marginBottom={false}
                        columns={columns}
                        count={childrenOrgunits?.orgUnits.length || 0}
                        extraProps={{
                            childrenOrgunits,
                            orgUnitsToUpdate,
                            loading: isFetchingChildrenOrgunits,
                        }}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => setParentSelected(undefined)}
                    color="primary"
                    data-test="close-button"
                >
                    {formatMessage(MESSAGES.cancel)}
                </Button>
                <Button
                    onClick={handleSave}
                    color="primary"
                    data-test="save-button"
                    disabled={orgUnitsToUpdate.length === 0}
                >
                    {formatMessage(MESSAGES.confirm)}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
