import {
    makeStyles,
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions,
    Button,
} from '@material-ui/core';
import isEqual from 'lodash/isEqual';
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
} from 'react';

import { OrgUnit } from '../../orgUnits/types/orgUnit';
import {
    OrgUnitShape,
    Locations,
    OrgUnitMarker,
    BaseLocation,
} from '../types/locations';
import { SubTeam, User, DropdownTeamsOptions, Team } from '../types/team';
import { AssignmentsApi, SaveAssignmentQuery } from '../types/assigment';
import { Profile } from '../../../utils/usersUtils';
import { Planning } from '../types/planning';

import { useColumns } from '../configs/ParentDialogColumns';

import {
    getTeamUserName,
    getMultiSaveParams,
    getOrgUnitAssignation,
} from '../utils';

import MESSAGES from '../messages';

type Props = {
    currentTeam: Team | undefined;
    teams: DropdownTeamsOptions[];
    profiles: Profile[];
    childrenOrgunits: OrgUnit[];
    locations: Locations | undefined;
    parentSelected: OrgUnitShape | undefined;
    // eslint-disable-next-line no-unused-vars
    setParentSelected: (orgUnit: OrgUnitShape | undefined) => void;
    allAssignments: AssignmentsApi;
    selectedItem: SubTeam | User | undefined;
    planning: Planning | undefined;
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
    setParentSelected,
    allAssignments,
    selectedItem,
    locations,
    currentTeam,
    teams,
    profiles,
    planning,
    saveMultiAssignments,
}) => {
    const { formatMessage } = useSafeIntl();
    const [orgUnitsToUpdate, setOrgUnitsToUpdate] = useState<Array<number>>([]);
    const [mappedOrgUnits, setMappedOrgUnits] = useState<
        Array<OrgUnitShape | OrgUnitMarker | BaseLocation>
    >([]);
    const assignableOrgUnits = mappedOrgUnits.filter(
        orgUnit =>
            !orgUnit.otherAssignation ||
            (orgUnit.otherAssignation &&
                !orgUnit.otherAssignation?.assignedTeam &&
                !orgUnit.otherAssignation?.assignedUser),
    );

    const columns = useColumns({
        orgUnitsToUpdate,
        setOrgUnitsToUpdate,
    });
    const classes: Record<string, string> = useStyles();
    const [open, setOpen] = useState<boolean>(false);

    console.log('orgUnitsToUpdate', orgUnitsToUpdate);
    useEffect(() => {
        const newList = assignableOrgUnits
            .map(orgUnit => {
                const { assignment, assignedTeam, assignedUser } =
                    getOrgUnitAssignation(
                        allAssignments,
                        orgUnit,
                        teams,
                        profiles,
                        currentTeam?.type,
                    );
                return {
                    id: orgUnit.id,
                    assignment,
                    assignedTeam,
                    assignedUser,
                };
            })
            .filter(
                assignment =>
                    assignment?.assignedTeam?.original.id !==
                        selectedItem?.id &&
                    assignment?.assignedUser?.user_id !== selectedItem?.id,
            )
            .map(orgUnit => orgUnit.id);
        if (!isEqual(newList, orgUnitsToUpdate)) {
            setOrgUnitsToUpdate(newList);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        allAssignments,
        currentTeam?.type,
        profiles,
        selectedItem?.id,
        teams,
        // assignableOrgUnits,
    ]);

    useEffect(() => {
        if (childrenOrgunits.length > 0 && parentSelected && locations) {
            const mapping: Array<OrgUnitShape | OrgUnitMarker | BaseLocation> =
                [];
            childrenOrgunits.forEach((orgUnit: OrgUnit) => {
                const shape: OrgUnitShape | undefined =
                    locations.shapes.all.find(
                        location => location.id === orgUnit.id,
                    );
                const marker: OrgUnitMarker | undefined =
                    locations.markers.all.find(
                        location => location.id === orgUnit.id,
                    );
                if (shape) {
                    mapping.push(shape);
                } else if (marker) {
                    mapping.push(marker);
                } else {
                    mapping.push({
                        ...orgUnit,
                        id: orgUnit.id,
                        name: orgUnit.name,
                        orgUnitTypeId: orgUnit.org_unit_type_id,
                        otherAssignation: undefined,
                    });
                }
            });
            setMappedOrgUnits(mapping);
        }
        if (!open && childrenOrgunits.length > 0 && parentSelected) {
            setOpen(true);
        } else if (open) {
            setOpen(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [childrenOrgunits, parentSelected, locations]);

    const handleSave = async (): Promise<void> => {
        setParentSelected(undefined);
        if (selectedItem && planning) {
            await saveMultiAssignments(
                getMultiSaveParams({
                    selectedOrgUnits: assignableOrgUnits,
                    currentType: currentTeam?.type,
                    selectedItem,
                    planning,
                    orgUnitsToUpdate,
                }),
            );
        }
    };

    const closeDialog = useCallback(() => {
        setOpen(false);
    }, [setOpen]);
    if (!open) return null;

    return (
        <Dialog
            fullWidth
            maxWidth="sm"
            open
            classes={{
                paper: classes.paper,
            }}
            onClose={(event, reason) => {
                if (reason === 'backdropClick') {
                    closeDialog();
                }
            }}
            scroll="body"
            data-test=""
        >
            <DialogTitle>
                {parentSelected &&
                    orgUnitsToUpdate.length > 0 &&
                    formatMessage(MESSAGES.parentDialogTitle, {
                        assignmentCount: orgUnitsToUpdate.length,
                        parentOrgUnitName: getTeamUserName(
                            selectedItem,
                            currentTeam,
                            profiles,
                            teams,
                        ),
                    })}
                {parentSelected &&
                    orgUnitsToUpdate.length === 0 &&
                    formatMessage(MESSAGES.parentDialogTitleUnsassign, {
                        assignmentCount: assignableOrgUnits.length,
                        parentOrgUnitName: getTeamUserName(
                            selectedItem,
                            currentTeam,
                            profiles,
                            teams,
                        ),
                    })}
            </DialogTitle>
            <DialogContent className={classes.content}>
                <Table
                    elevation={0}
                    data={mappedOrgUnits}
                    showPagination={false}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    countOnTop={false}
                    marginTop={false}
                    marginBottom={false}
                    columns={columns}
                    count={mappedOrgUnits.length}
                    extraProps={{
                        childrenOrgunits,
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
                    onClick={() => handleSave()}
                    color="primary"
                    data-test="save-button"
                >
                    {formatMessage(MESSAGES.confirm)}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
