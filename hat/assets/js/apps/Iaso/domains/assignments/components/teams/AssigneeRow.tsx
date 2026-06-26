import React, { FunctionComponent, useCallback, useState } from 'react';
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
import { IconButton as MuiIconButton } from '@mui/material';
import { IconButton } from 'bluesquare-components';
import { ColorPicker } from 'Iaso/components/forms/ColorPicker';
import { SubTeam, User } from 'Iaso/domains/teams/types/team';
import { useAssignmentsContext } from '../../contexts/AssignmentsContext';
import { useBulkDeleteAssignments } from '../../hooks/requests/useBulkDeleteAssignments';
import MESSAGES from '../../messages';
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
                <TableCell
                    sx={{
                        textAlign: 'center',
                    }}
                >
                    {count}
                </TableCell>

                <TableCell>
                    <IconButton
                        tooltipMessage={MESSAGES.deleteAssignments}
                        onClick={() => deleteAssignments()}
                        icon="delete"
                        disabled={count === 0}
                    />
                    {hasChildren && (
                        <MuiIconButton
                            aria-label="expand row"
                            size="small"
                            onClick={() => setOpen(!open)}
                        >
                            {open ? (
                                <KeyboardArrowUpIcon />
                            ) : (
                                <KeyboardArrowDownIcon />
                            )}
                        </MuiIconButton>
                    )}
                </TableCell>
            </TableRow>
            {hasChildren && team && (
                <TableRow>
                    <TableCell colSpan={5} sx={{ padding: 0 }}>
                        <Collapse in={open} timeout="auto" unmountOnExit>
                            <Box sx={{ pl: 4 }}>
                                <Table size="small">
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
