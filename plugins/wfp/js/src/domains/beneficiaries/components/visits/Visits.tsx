import React, { FunctionComponent } from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';
import { Journey, Visit } from '../../types';
import { VisitRow } from './VisitRow';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    root: {
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
    },
}));

export const Visits: FunctionComponent<{
    journey: Journey;
    visits: Visit[];
}> = ({ journey, visits }) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
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
        <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" className={classes.root}>
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
                            <TableCell
                                colSpan={9}
                                sx={{ color: 'text.secondary' }}
                            >
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
