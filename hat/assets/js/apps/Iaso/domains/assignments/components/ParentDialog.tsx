import {
    makeStyles,
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions,
    Button,
} from '@material-ui/core';
import {
    // @ts-ignore
    commonStyles,
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    Table,
} from 'bluesquare-components';
import React, {
    FunctionComponent,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from 'react';

import { ChildrenOrgUnits, ParentOrgUnit } from '../types/orgUnit';
import { SubTeam, User, DropdownTeamsOptions, Team } from '../types/team';
import { SaveAssignmentQuery } from '../types/assigment';
import { Profile } from '../../../utils/usersUtils';
import { Planning } from '../types/planning';

import { useColumns } from '../configs/ParentDialogColumns';

import { getTeamUserName, getMultiSaveParams } from '../utils';

import MESSAGES from '../messages';

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
        overflow: 'visible',
    },
    content: {
        overflow: 'visible',
        padding: theme.spacing(0),
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
            scroll="body"
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
