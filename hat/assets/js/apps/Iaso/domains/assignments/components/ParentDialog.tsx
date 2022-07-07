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

import { getTeamName, getMultiSaveParams } from '../utils';

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
    const columns = useColumns({ teams });
    const classes: Record<string, string> = useStyles();
    const [open, setOpen] = useState<boolean>(false);
    const [mappedOrgUnits, setMappedOrgUnits] = useState<
        Array<OrgUnitShape | OrgUnitMarker | BaseLocation>
    >([]);

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

    const assignableOrgUnits = mappedOrgUnits.filter(
        orgUnit =>
            !orgUnit.otherAssignation ||
            (orgUnit.otherAssignation &&
                !orgUnit.otherAssignation?.assignedTeam &&
                !orgUnit.otherAssignation?.assignedUser),
    );

    const handleSave = async (): Promise<void> => {
        setParentSelected(undefined);
        if (selectedItem && planning) {
            await saveMultiAssignments(
                getMultiSaveParams({
                    allAssignments,
                    selectedOrgUnits: assignableOrgUnits,
                    teams,
                    profiles,
                    currentType: currentTeam?.type,
                    selectedItem,
                    planning,
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
                    formatMessage(MESSAGES.parentDialogTitle, {
                        assignmentCount: assignableOrgUnits.length,
                        parentOrgUnitName: getTeamName(
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
