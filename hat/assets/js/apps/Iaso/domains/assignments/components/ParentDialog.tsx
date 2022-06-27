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
import { OrgUnitShape, Locations, OrgUnitMarker } from '../types/locations';
import { SubTeam, User, DropdownTeamsOptions, Team } from '../types/team';
import { AssignmentsApi } from '../types/assigment';
import { Profile } from '../../../utils/usersUtils';

import { getColumns } from '../configs/ParentDialogColumns';

import { getTeamName } from '../utils';

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
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const [open, setOpen] = useState<boolean>(false);
    const [mappedOrgUnits, setMappedOrgUnits] = useState<
        Array<OrgUnitShape | OrgUnitMarker | OrgUnit>
    >([]);

    useEffect(() => {
        if (childrenOrgunits.length > 0 && parentSelected && locations) {
            const mapping: Array<OrgUnitShape | OrgUnitMarker | OrgUnit> = [];
            childrenOrgunits.forEach(orgUnit => {
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
                    mapping.push(orgUnit);
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

    const handleSave = () => {
        // should assign all org unit of base org unit type inside the clicked parent to the selectedItem
        // for each org unit assign it to selectedItem (team or user)
        // console.log('save', childrenOrgunits, parentSelected);
        setParentSelected(undefined);
    };

    const closeDialog = useCallback(() => {
        setOpen(false);
    }, [setOpen]);
    if (!open) return null;

    const assignableOrgUnits = childrenOrgunits.filter(
        orgUnit =>
            !allAssignments.some(
                assignment => assignment.org_unit === orgUnit.id,
            ),
    );
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
                    columns={getColumns({ formatMessage, teams })}
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
