import React, { FC } from 'react';
import { Box, TableCell, TableHead, TableRow } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';

const headerCell = {
    color: 'text.primary',
    fontWeight: 500,
    py: 1.5,
};

const styles: SxStyles = {
    headerCell,
    numberHeaderCell: {
        ...headerCell,
        width: 120,
        maxWidth: 140,
        whiteSpace: 'nowrap',
    },
    actionsHeaderCell: {
        width: 56,
        py: 1.5,
    },
};

type Props = {
    minLabel: string;
    maxLabel: string;
    withActions?: boolean;
};

export const MissionFormsTableHead: FC<Props> = ({
    minLabel,
    maxLabel,
    withActions = false,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <TableHead>
            <TableRow>
                <TableCell sx={styles.headerCell}>
                    {formatMessage(MESSAGES.form)}
                </TableCell>
                <TableCell sx={styles.numberHeaderCell}>{minLabel}</TableCell>
                <TableCell sx={styles.numberHeaderCell}>{maxLabel}</TableCell>
                {withActions && (
                    <TableCell sx={styles.actionsHeaderCell}>
                        <Box component="span" sx={visuallyHidden}>
                            {formatMessage(MESSAGES.actions)}
                        </Box>
                    </TableCell>
                )}
            </TableRow>
        </TableHead>
    );
};
