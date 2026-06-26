import React, { FunctionComponent, useCallback, useMemo } from 'react';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import { TableCell, TableRow, Radio, useTheme } from '@mui/material';
import { IconButton } from 'bluesquare-components';
import { ColorPicker } from 'Iaso/components/forms/ColorPicker';
import { SubTeam, User } from 'Iaso/domains/teams/types/team';
import { useAssignmentsContext } from '../../contexts/AssignmentsContext';
import { useBulkDeleteAssignments } from '../../hooks/requests/useBulkDeleteAssignments';
import MESSAGES from '../../messages';
import { createAssigmentBadgeIcon } from './AssigmentBadge';

type Props = {
    user?: User;
    team?: SubTeam;
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
    isActive,
    setSelectedRow,
    currentColor,
    displayName,
    count,
    onColorChange,
}) => {
    const theme = useTheme();
    const { planningId } = useAssignmentsContext();

    const { mutateAsync } = useBulkDeleteAssignments();
    const deleteAssignments = useCallback(() => {
        if (team) {
            mutateAsync({ planning: planningId, team: team.id });
        } else if (user) {
            mutateAsync({ planning: planningId, user: user.id });
        }
    }, [user, team, planningId, mutateAsync]);

    const assignmentBadgeIcon = useMemo(
        () => createAssigmentBadgeIcon(count),
        [count],
    );

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
                <Radio checked={isActive} onChange={() => setSelectedRow()} />
            </TableCell>
            <TableCell
                sx={{
                    width: 50,
                    textAlign: 'center',
                    '& .MuiBox-root': {
                        width: 25,
                        height: 25,
                        display: 'inline-block',
                        position: 'relative',
                        top: 0.5,
                    },
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
            <TableCell sx={{ textAlign: 'right' }}>
                {count > 0 && (
                    <IconButton
                        tooltipMessage={MESSAGES.assignationsCount}
                        overrideIcon={assignmentBadgeIcon}
                        onClick={() => undefined}
                        color="primary"
                    />
                )}
                {count === 0 && (
                    <IconButton
                        tooltipMessage={MESSAGES.noAssignments}
                        overrideIcon={AssignmentLateIcon}
                        onClick={() => undefined}
                    />
                )}
                <IconButton
                    tooltipMessage={MESSAGES.deleteAssignments}
                    onClick={() => deleteAssignments()}
                    icon="delete"
                    disabled={count === 0}
                    color={count === 0 ? 'action' : 'primary'}
                />
            </TableCell>
        </TableRow>
    );
};
