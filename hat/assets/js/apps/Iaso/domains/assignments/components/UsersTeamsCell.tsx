import React, { FunctionComponent } from 'react';
import Color from 'color';
import { Chip, Box, Tooltip } from '@mui/material';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../messages';

import { OrgUnitAssignedTeamUser } from '../utils';
import { getDisplayName } from '../../../utils/usersUtils';

type Props = {
    assignmentObject: OrgUnitAssignedTeamUser;
};

export const UsersTeamsCell: FunctionComponent<Props> = ({
    assignmentObject,
}) => {
    const { formatMessage } = useSafeIntl();
    const getTextColor = (backgroundColor: string): string => {
        const bgColor = Color(backgroundColor);
        return bgColor.isDark() ? '#fff' : '#000';
    };
    return (
        <Box>
            {assignmentObject.assignment && (
                <Box display="inline-block">
                    <Tooltip
                        arrow
                        title={formatMessage(MESSAGES.clickRowToUnAssign)}
                        placement="bottom"
                    >
                        <Box>
                            {assignmentObject.assignedTeam && (
                                <Chip
                                    label={assignmentObject.assignedTeam.label}
                                    size="small"
                                    style={{
                                        backgroundColor:
                                            assignmentObject.assignedTeam.color,
                                        color: getTextColor(
                                            assignmentObject.assignedTeam.color,
                                        ),
                                    }}
                                />
                            )}

                            {assignmentObject.assignedUser && (
                                <Chip
                                    size="small"
                                    label={getDisplayName(
                                        assignmentObject.assignedUser,
                                    )}
                                    style={{
                                        backgroundColor:
                                            assignmentObject.assignedUser.color,
                                        color: getTextColor(
                                            assignmentObject.assignedUser.color,
                                        ),
                                    }}
                                />
                            )}
                        </Box>
                    </Tooltip>
                </Box>
            )}
            {!assignmentObject.assignment && '-'}
        </Box>
    );
};
