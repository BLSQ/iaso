import React, { FunctionComponent } from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@mui/material';
import { Theme } from '@mui/material/styles';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';
import { Journey, Visit } from '../../types';
import { VisitRow } from './VisitRow';

const styles: SxStyles = {
    container: {
        overflowX: 'auto',
    },
    table: (theme: Theme) => ({
        '& th': {
            height: 40,
            fontSize: 12,
            color: theme.palette.text.secondary,
            background: 'rgba(0, 0, 0, 0.02)',
            whiteSpace: 'nowrap',
        },
        '& td': { padding: theme.spacing(0.75, 2) },
        '& tbody tr:last-child td': { borderBottom: 'none' },
        '& tbody tr:hover': { background: 'rgba(0, 0, 0, 0.03)' },
    }),
    emptyCell: {
        color: 'text.secondary',
    },
};

export const Visits: FunctionComponent<{
    journey: Journey;
    visits: Visit[];
}> = ({ journey, visits }) => {
    const { formatMessage } = useSafeIntl();
    const headers = [
        '#',
        formatMessage(MESSAGES.date),
        formatMessage(MESSAGES.orgUnit),
        formatMessage(MESSAGES.muac),
        formatMessage(MESSAGES.whz),
        formatMessage(MESSAGES.oedema),
        formatMessage(MESSAGES.entryPoint),
        formatMessage(MESSAGES.assistance),
        formatMessage(MESSAGES.submission),
    ];
    return (
        <Box sx={styles.container}>
            <Table size="small" sx={styles.table}>
                <TableHead>
                    <TableRow>
                        {headers.map(header => (
                            <TableCell key={header}>{header}</TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {visits.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={9} sx={styles.emptyCell}>
                                {formatMessage(MESSAGES.noVisits)}
                            </TableCell>
                        </TableRow>
                    )}
                    {visits.map(visit => (
                        <VisitRow
                            key={visit.id}
                            visit={visit}
                            programmeType={journey.programme_type}
                        />
                    ))}
                </TableBody>
            </Table>
        </Box>
    );
};
