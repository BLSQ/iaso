import React, { FunctionComponent } from 'react';
import {
    Box,
    Chip,
    ChipProps,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useSafeIntl } from 'bluesquare-components';
import { SubmissionLink } from './Fragments';
import MESSAGES from './../messages';
import { Beneficiary, Journey } from './../types';
import { formatDate, muacColor, programmeColor } from './../utils';
import { Visits } from './Visits';

type Tone = ChipProps['color'];

const BAD_EXITS = ['death', 'defaulter', 'non_respondent'];

const exitTone = (exitType: string): Tone => {
    if (exitType === 'cured') return 'success';
    if (BAD_EXITS.includes(exitType)) return 'error';
    if (exitType.includes('transfer')) return 'primary';
    return 'default';
};

const WHZ_TONES: Record<string, Tone> = {
    Green: 'success',
    Yellow: 'warning',
    Red: 'error',
};

const JourneyHeader: FunctionComponent<{
    journey: Journey;
    number: number;
}> = ({ journey, number }) => {
    const { formatMessage } = useSafeIntl();
    const theme = useTheme();
    // empty values of the ETL count as missing too
    const programme = journey.nutrition_programme?.trim();
    const color = programmeColor(theme, programme);
    return (
        <Box
            display="flex"
            alignItems="center"
            flexWrap="wrap"
            gap={1}
            sx={{
                px: 2,
                py: 1.5,
                borderBottom: `1px solid ${theme.palette.divider}`,
                borderLeft: `4px solid ${theme.palette.primary.main}`,
            }}
        >
            <Typography fontWeight={500} mr={0.5}>
                {formatMessage(MESSAGES.journey, { number: `${number}` })}
            </Typography>
            <Chip
                size="small"
                variant={programme ? 'filled' : 'outlined'}
                sx={
                    color
                        ? { bgcolor: color, color: 'white' }
                        : { fontWeight: programme ? undefined : 'bold' }
                }
                label={programme || formatMessage(MESSAGES.noProgramme)}
            />
            {journey.programme_type && (
                <Chip size="small" label={journey.programme_type} />
            )}
            {journey.physiology_status && (
                <Chip size="small" label={journey.physiology_status} />
            )}
            {journey.admission_type && (
                <Chip
                    size="small"
                    variant="outlined"
                    label={formatMessage(MESSAGES.admission, {
                        admissionType: journey.admission_type,
                    })}
                />
            )}
            {journey.admission_criteria && (
                <Chip
                    size="small"
                    variant="outlined"
                    label={formatMessage(MESSAGES.admissionCriteria, {
                        admissionCriteria: journey.admission_criteria,
                    })}
                />
            )}
            {journey.exit_type ? (
                <Chip
                    size="small"
                    color={exitTone(journey.exit_type)}
                    label={formatMessage(MESSAGES.exit, {
                        exitType: journey.exit_type,
                    })}
                />
            ) : (
                <Chip
                    size="small"
                    color="success"
                    variant="outlined"
                    label={formatMessage(MESSAGES.ongoing)}
                />
            )}
            <Typography
                variant="body2"
                color="textSecondary"
                sx={{ ml: 'auto', whiteSpace: 'nowrap' }}
            >
                {`${formatDate(journey.start_date)} → ${formatDate(journey.end_date) || '…'}`}
            </Typography>
        </Box>
    );
};

const JourneyVisits: FunctionComponent<{ journey: Journey }> = ({
    journey,
}) => {
    const { formatMessage } = useSafeIntl();
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
            <Table
                size="small"
                sx={{
                    '& th': {
                        height: 40,
                        fontSize: 12,
                        color: 'text.secondary',
                        background: 'rgba(0, 0, 0, 0.02)',
                        whiteSpace: 'nowrap',
                    },
                    '& td': { py: 0.75, px: 2 },
                    '& tbody tr:last-child td': { borderBottom: 'none' },
                    '& tbody tr:hover': { background: 'rgba(0, 0, 0, 0.03)' },
                }}
            >
                <TableHead>
                    <TableRow>
                        {headers.map(header => (
                            <TableCell key={header}>{header}</TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {journey.visits.length === 0 && (
                        <TableRow>
                            <TableCell
                                colSpan={9}
                                sx={{ color: 'text.secondary' }}
                            >
                                {formatMessage(MESSAGES.noVisits)}
                            </TableCell>
                        </TableRow>
                    )}
                    {journey.visits.map(visit => (
                        <TableRow key={visit.id}>
                            <TableCell>
                                <Box
                                    component="span"
                                    sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        background: alpha(
                                            theme.palette.primary.main,
                                            0.08,
                                        ),
                                        color: 'primary.main',
                                        fontWeight: 500,
                                        fontSize: 12,
                                    }}
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
                                            sx={{
                                                display: 'inline-block',
                                                width: 10,
                                                height: 10,
                                                borderRadius: '50%',
                                                mr: 0.75,
                                                verticalAlign: 'middle',
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
                                {visit.whz_color &&
                                    (WHZ_TONES[visit.whz_color] ? (
                                        <Chip
                                            size="small"
                                            color={WHZ_TONES[visit.whz_color]}
                                            label={visit.whz_color}
                                        />
                                    ) : (
                                        visit.whz_color
                                    ))}
                            </TableCell>
                            <TableCell>
                                {visit.oedema ? (
                                    <Chip
                                        size="small"
                                        color="error"
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
                                        <Chip
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

// Expanded row of a beneficiary: one card per journey, with its visits
export const Journeys: FunctionComponent<{ beneficiary: Beneficiary }> = ({
    beneficiary,
}) => {
    const { formatMessage } = useSafeIntl();
    if (beneficiary.journeys.length === 0) {
        return (
            <Typography color="textSecondary" sx={{ pt: 1.5 }}>
                {formatMessage(MESSAGES.noJourneys)}
            </Typography>
        );
    }
    return (
        <>
            {beneficiary.journeys.map((journey, index) => (
                <Paper key={journey.id} sx={{ mt: 1.5, overflow: 'hidden' }}>
                    <JourneyHeader journey={journey} number={index + 1} />
                    <Visits journey={journey} visits={journey.visits} />
                </Paper>
            ))}
        </>
    );
};
