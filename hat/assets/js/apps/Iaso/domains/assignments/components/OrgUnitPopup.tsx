import React, { FunctionComponent, useMemo } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { Paper, makeStyles, ClickAwayListener, Box } from '@material-ui/core';
import { OrgUnitMarker, OrgUnitShape } from '../types/locations';
import { DropdownTeamsOptions } from '../types/team';
import { AssignmentsApi } from '../types/assigment';

import { OrgUnitPopupLine } from './OrgUnitPopupLine';
import { LinkToOrgUnit } from './LinkToOrgUnit';
import { AlreadyAssigned } from './AlreadyAssigned';
import { UsersTeamsCell } from './UsersTeamsCell';
import { Profile } from '../../../utils/usersUtils';

import { getOrgUnitAssignation } from '../utils';

import MESSAGES from '../messages';

type Props = {
    top: number;
    left: number;
    handleClickAway: () => void;
    location: OrgUnitShape | OrgUnitMarker;
    alreadyAssigned: boolean;
    teams: DropdownTeamsOptions[];
    assignments: AssignmentsApi;
    profiles: Profile[];
};

export const useStyles = makeStyles(theme => ({
    root: {
        zIndex: 600,
        position: 'absolute',
    },
    arrow: {
        position: 'absolute',
        top: 5,
        left: '-4%',
        display: 'block',
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderWidth: '0 7.5px 13.0px 7.5px',
        borderColor: 'transparent transparent #ffffff transparent',
    },
    paper: {
        padding: theme.spacing(1, 1, 0, 1),
        top: theme.spacing(2),
        left: '-50%',
        position: 'relative',
    },
    title: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: theme.spacing(1),
    },
}));

export const OrgUnitPopup: FunctionComponent<Props> = ({
    top,
    left,
    handleClickAway,
    location,
    alreadyAssigned,
    teams,
    assignments,
    profiles,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const infos = useMemo(
        () => [
            {
                label: formatMessage(MESSAGES.name),
                value: <LinkToOrgUnit orgUnit={location} />,
            },
            {
                label: formatMessage(MESSAGES.orgUnitType),
                value: location.org_unit_type,
            },
        ],
        [formatMessage, location],
    );
    return (
        <ClickAwayListener onClickAway={handleClickAway}>
            <section
                className={classes.root}
                style={{
                    top,
                    left,
                }}
            >
                <span className={classes.arrow} />
                <Paper elevation={1} className={classes.paper}>
                    <Box display="inline-block">
                        {infos.map((info, index) => (
                            <OrgUnitPopupLine
                                key={index}
                                label={info.label}
                                value={info.value}
                            />
                        ))}
                        {alreadyAssigned && (
                            <OrgUnitPopupLine
                                label={formatMessage(MESSAGES.assignment)}
                                value={
                                    <Box width="200px">
                                        <AlreadyAssigned
                                            item={location}
                                            teams={teams}
                                        />
                                    </Box>
                                }
                            />
                        )}
                        {!alreadyAssigned && (
                            <OrgUnitPopupLine
                                label={formatMessage(MESSAGES.assignment)}
                                value={
                                    <UsersTeamsCell
                                        assignmentObject={getOrgUnitAssignation(
                                            assignments,
                                            location,
                                            teams || [],
                                            profiles || [],
                                            undefined,
                                        )}
                                    />
                                }
                            />
                        )}
                    </Box>
                </Paper>
            </section>
        </ClickAwayListener>
    );
};
