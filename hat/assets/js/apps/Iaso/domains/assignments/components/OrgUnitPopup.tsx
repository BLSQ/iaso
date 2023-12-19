import React, { FunctionComponent, useMemo } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { Paper, ClickAwayListener, Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import classnames from 'classnames';

import { OrgUnitMarker, OrgUnitShape } from '../types/locations';
import { DropdownTeamsOptions } from '../types/team';
import { AssignmentsApi } from '../types/assigment';

import { OrgUnitPopupLine } from './OrgUnitPopupLine';
import { LinkToOrgUnit } from '../../orgUnits/components/LinkToOrgUnit';
import { AlreadyAssigned } from './AlreadyAssigned';
import { UsersTeamsCell } from './UsersTeamsCell';
import { Profile } from '../../../utils/usersUtils';

import { getOrgUnitAssignation } from '../utils';

import { OrgUnitPath } from './OrgUnitPath';

import MESSAGES from '../messages';

type Props = {
    top: number;
    left: number;
    closePopup: () => void;
    location: OrgUnitShape | OrgUnitMarker;
    alreadyAssigned: boolean;
    teams: DropdownTeamsOptions[];
    assignments: AssignmentsApi;
    profiles: Profile[];
    popupPosition: 'top' | 'bottom' | 'left';
};

const useStyles = makeStyles(theme => ({
    root: {
        zIndex: 1001,
        position: 'absolute',
    },
    arrow: {
        position: 'absolute',
        display: 'block',
        width: 0,
        height: 0,
        borderStyle: 'solid',
        zIndex: 10,
    },
    arrowBottom: {
        top: 12,
        left: -7,
        borderWidth: '0 7.5px 13.0px 7.5px',
        borderColor: 'transparent transparent #ffffff transparent',
    },
    arrowTop: {
        top: -25,
        left: -7,
        borderWidth: '15px 7.5px 0 7.5px',
        borderColor: '#ffffff transparent transparent transparent',
    },
    arrowLeft: {
        top: -7,
        left: -25,
        borderWidth: '7.5px 0 7.5px 15px',
        borderColor: 'transparent transparent transparent #ffffff',
    },
    paper: {
        padding: theme.spacing(1, 1, 0, 1),
        position: 'relative',
        width: 300,
        userSelect: 'none',
    },
    paperBottom: {
        transform: 'translateX(-50%)',
        top: '25px',
    },
    paperTop: {
        transform: 'translateX(calc(-50%)) translateY(-100%)',
        bottom: '25px',
    },
    paperLeft: {
        transform: 'translateX(calc(-100%)) translateY(-50%)',
        right: '25px',
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
    closePopup,
    location,
    alreadyAssigned,
    teams,
    assignments,
    profiles,
    popupPosition,
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
                label: formatMessage(MESSAGES.parents),
                value: <OrgUnitPath location={location} />,
            },
        ],
        [formatMessage, location],
    );
    return (
        <ClickAwayListener onClickAway={closePopup}>
            <section
                className={classes.root}
                style={{
                    top,
                    left,
                }}
            >
                <span
                    className={classnames(
                        classes.arrow,
                        popupPosition === 'bottom' && classes.arrowBottom,
                        popupPosition === 'top' && classes.arrowTop,
                        popupPosition === 'left' && classes.arrowLeft,
                    )}
                />
                <Paper
                    elevation={1}
                    className={classnames(
                        classes.paper,
                        popupPosition === 'bottom' && classes.paperBottom,
                        popupPosition === 'top' && classes.paperTop,
                        popupPosition === 'left' && classes.paperLeft,
                    )}
                >
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
