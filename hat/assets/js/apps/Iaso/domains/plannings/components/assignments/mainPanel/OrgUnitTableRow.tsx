import React, { FC, useCallback } from 'react';
import LocationOffIcon from '@mui/icons-material/LocationOff';
import { Box, TableCell, TableRow, Tooltip, Typography } from '@mui/material';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import { numericValues } from 'Iaso/domains/instances/utils/intl';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../../messages';
import { AssigneeCell } from './AssigneeCell';
import { OrgUnitRow } from './types';

const styles = {
    openable: {
        cursor: 'pointer',
    },
    name: {
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
    },
    offMapIcon: {
        fontSize: 16,
        color: 'mediumGray.main',
    },
    secondary: {
        color: 'text.secondary',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
} satisfies SxStyles;

type Props = {
    row: OrgUnitRow;
    onOpenTeam: (teamId: number) => void;
};

export const OrgUnitTableRow: FC<Props> = ({ row, onOpenTeam }) => {
    const { formatMessage } = useSafeIntl();
    const { teamId } = row;
    const handleClick = useCallback(() => {
        if (teamId) onOpenTeam(teamId);
    }, [teamId, onOpenTeam]);
    return (
        <TableRow
            hover
            onClick={teamId ? handleClick : undefined}
            sx={teamId ? styles.openable : undefined}
        >
            <TableCell>
                <Box sx={styles.name}>
                    <Typography variant="body2">{row.name}</Typography>
                    {row.isOffMap && (
                        <Tooltip title={formatMessage(MESSAGES.notOnMap)}>
                            <LocationOffIcon sx={styles.offMapIcon} />
                        </Tooltip>
                    )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                    {row.org_unit_type_name ?? textPlaceholder}
                </Typography>
            </TableCell>
            <TableCell>
                <Typography variant="body2" sx={styles.secondary}>
                    {row.parentName ?? textPlaceholder}
                </Typography>
            </TableCell>
            <TableCell>
                <AssigneeCell assignee={row.assignee} />
            </TableCell>
            <TableCell>
                <Typography variant="body2" sx={styles.secondary}>
                    {row.below
                        ? formatMessage(
                              MESSAGES.belowAssigned,
                              numericValues(row.below),
                          )
                        : textPlaceholder}
                </Typography>
            </TableCell>
        </TableRow>
    );
};
