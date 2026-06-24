import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import {
    TableCell,
    TableRow,
    Radio,
    useTheme,
    Collapse,
    Table,
    Box,
} from '@mui/material';
import { IconButton } from 'bluesquare-components';
import { ColorPicker } from 'Iaso/components/forms/ColorPicker';
import { SubTeam, User } from 'Iaso/domains/teams/types/team';
import { useAssignmentsContext } from '../../contexts/AssignmentsContext';
import { useBulkDeleteAssignments } from '../../hooks/requests/useBulkDeleteAssignments';
import MESSAGES from '../../messages';
import { createAssigmentBadgeIcon } from './AssigmentBadge';
import { TeamTableBody } from './TeamTableBody';

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

    const [open, setOpen] = useState<boolean>(false);
    const hasChildren = Boolean(
        team &&
        ((team.sub_teams_details?.length ?? 0) > 0 ||
            (team.users_details?.length ?? 0) > 0),
    );

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
        <>
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
                    <Radio
                        checked={isActive}
                        onChange={() => setSelectedRow()}
                    />
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
                    {hasChildren && (
                        <IconButton
                            tooltipMessage={
                                open ? MESSAGES.collapse : MESSAGES.expand
                            }
                            onClick={() => setOpen(!open)}
                            overrideIcon={
                                open
                                    ? KeyboardArrowUpIcon
                                    : KeyboardArrowDownIcon
                            }
                        />
                    )}
                </TableCell>
            </TableRow>
            {hasChildren && team && (
                <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                    <TableCell colSpan={5} sx={{ padding: 0 }}>
                        <Collapse in={open} timeout="auto" unmountOnExit>
                            <Box sx={{ pl: 2 }}>
                                <Table
                                    size="small"
                                    sx={{
                                        borderLeft: `1px solid ${theme.palette.divider}`,
                                        backgroundColor: 'white',
                                    }}
                                >
                                    <TeamTableBody rootTeam={team} />
                                </Table>
                            </Box>
                        </Collapse>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
};
