import React, { FunctionComponent, useCallback } from 'react';
import { TableCell, TableRow, Checkbox, useTheme } from '@mui/material';
import { IconButton } from 'bluesquare-components';
import { ColorPicker } from 'Iaso/components/forms/ColorPicker';
import { Team, User } from 'Iaso/domains/teams/types/team';
import { useBulkDeleteAssignments } from '../../hooks/requests/useBulkDeleteAssignments';
import MESSAGES from '../../messages';

type Props = {
    user?: User;
    team?: Team;
    planningId: string;
    isActive: boolean;
    setSelectedRow: () => void;
    currentColor: string;
    displayName: string;
    count: number;
    onColorChange: (color: string) => void;
};

export const AssigneeRow: FunctionComponent<Props> = ({
    user,
    team,
    planningId,
    isActive,
    setSelectedRow,
    currentColor,
    displayName,
    count,
    onColorChange,
}) => {
    const theme = useTheme();
    const { mutateAsync } = useBulkDeleteAssignments();
    const deleteAssignments = useCallback(() => {
        if (team) {
            mutateAsync({ planning: planningId, team: team.id });
        } else if (user) {
            mutateAsync({ planning: planningId, user: user.id });
        } else {
            console.log('NOTHING!');
        }
    }, [user, team, planningId, mutateAsync]);
    return (
        <TableRow
            sx={{
                backgroundColor: isActive
                    ? theme.palette.grey[200]
                    : 'transparent',
            }}
        >
            <TableCell
                sx={{
                    width: 50,
                    textAlign: 'center',
                }}
            >
                <Checkbox
                    checked={isActive}
                    onChange={() => setSelectedRow()}
                />
            </TableCell>
            <TableCell
                sx={{
                    width: 50,
                    textAlign: 'center',
                }}
            >
                <ColorPicker
                    currentColor={currentColor}
                    displayLabel={false}
                    onChangeColor={color => {
                        onColorChange(color);
                    }}
                />
            </TableCell>
            <TableCell>{displayName}</TableCell>
            <TableCell
                sx={{
                    textAlign: 'center',
                }}
            >
                {count}
            </TableCell>
            <TableCell
                sx={{
                    textAlign: 'center',
                }}
            >
                <IconButton
                    tooltipMessage={MESSAGES.cancel}
                    onClick={() => deleteAssignments()}
                    icon="delete"
                />
            </TableCell>
        </TableRow>
    );
};
