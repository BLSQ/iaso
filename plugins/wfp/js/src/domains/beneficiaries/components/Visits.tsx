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
import { alpha, useTheme } from '@mui/material/styles';
import { ColorChip, commonStyles, useSafeIntl } from 'bluesquare-components';
import { SubmissionLink } from './Fragments';
import MESSAGES from './../messages';
import { Journey, Visit } from './../types';
import { formatDate, muacColor, whzColor } from './../utils';

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
    visitNumber: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
        borderRadius: '50%',
        background: alpha(theme.palette.primary.main, 0.08),
        color: theme.palette.primary.main,
        fontWeight: 500,
        fontSize: 12,
    },
    muac: {
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        marginRight: theme.spacing(0.75),
        verticalAlign: 'middle',
    },
}));

export const Visits: FunctionComponent<{
    journey: Journey;
    visits: Visit[];
}> = ({ journey, visits }) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const theme = useTheme();
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
                        <TableRow key={visit.id}>
                            <TableCell>
                                <Box
                                    component="span"
                                    className={classes.visitNumber}
                                >
                                    {visit.number}
                                </Box>
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                {formatDate(visit.date)}
                            </TableCell>
                            <TableCell>{visit.org_unit_name ?? ''}</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                {visit.muac_size && (
                                    <>
                                        <Box
                                            component="span"
                                            className={classes.muac}
                                            sx={{
                                                background: muacColor(
                                                    theme,
                                                    Number(visit.muac_size),
                                                    journey.programme_type,
                                                ),
                                            }}
                                        />
                                        {visit.muac_size}
                                    </>
                                )}
                            </TableCell>
                            <TableCell>
                                {visit.whz_color && (
                                    <ColorChip
                                        size="small"
                                        color={whzColor(theme, visit.whz_color)}
                                        label={visit.whz_color}
                                    />
                                )}
                            </TableCell>
                            <TableCell>
                                {visit.oedema ? (
                                    <ColorChip
                                        size="small"
                                        color={theme.palette.error.main}
                                        label={formatMessage(MESSAGES.yes)}
                                    />
                                ) : (
                                    <Box
                                        component="span"
                                        color="text.secondary"
                                    >
                                        {formatMessage(MESSAGES.no)}
                                    </Box>
                                )}
                            </TableCell>
                            <TableCell>{visit.entry_point ?? ''}</TableCell>
                            <TableCell>
                                {visit.steps.length === 0 ? (
                                    <Box
                                        component="span"
                                        color="text.secondary"
                                    >
                                        {formatMessage(MESSAGES.none)}
                                    </Box>
                                ) : (
                                    visit.steps.map(step => (
                                        <ColorChip
                                            size="small"
                                            key={step.id}
                                            label={`${step.assistance_type}: ${step.quantity_given}${step.ration_size ? ` (${step.ration_size})` : ''}`}
                                        />
                                    ))
                                )}
                            </TableCell>
                            <TableCell>
                                {visit.instance_id && (
                                    <SubmissionLink
                                        instanceId={visit.instance_id}
                                    />
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Box>
    );
};
