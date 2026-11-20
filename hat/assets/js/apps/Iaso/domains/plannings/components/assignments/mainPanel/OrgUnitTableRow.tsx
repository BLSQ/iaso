import React, { FC, useCallback } from 'react';
import LocationOffIcon from '@mui/icons-material/LocationOff';
import Box from '@mui/material/Box/Box';
import { amber } from '@mui/material/colors';
import { alpha } from '@mui/material/styles';
import TableCell from '@mui/material/TableCell/TableCell';
import TableRow from '@mui/material/TableRow/TableRow';
import Tooltip from '@mui/material/Tooltip/Tooltip';
import Typography from '@mui/material/Typography/Typography';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import { numericValues } from 'Iaso/domains/instances/utils/intl';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../../messages';
import { AssigneeCell } from './AssigneeCell';
import { OrgUnitRow } from './types';

const styles = {
    clickable: {
        cursor: 'pointer',
    },
    focused: {
        bgcolor: alpha(amber[600], 0.18),
        '&.MuiTableRow-hover:hover': { bgcolor: alpha(amber[600], 0.26) },
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
    // Found with "Find an org unit".
    isFocused: boolean;
    isClickable: boolean;
    onClick: (row: OrgUnitRow) => void;
};

export const OrgUnitTableRow: FC<Props> = ({
    row,
    isFocused,
    isClickable,
    onClick,
}) => {
    const { formatMessage } = useSafeIntl();
    const handleClick = useCallback(() => onClick(row), [onClick, row]);
    return (
        <TableRow
            hover
            onClick={isClickable ? handleClick : undefined}
            sx={[isClickable && styles.clickable, isFocused && styles.focused]}
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
                    {row.org_unit_type?.name ?? textPlaceholder}
                </Typography>
            </TableCell>
            <TableCell>
                <Typography variant="body2" sx={styles.secondary}>
                    {row.parentName}
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
