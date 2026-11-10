import React, { FunctionComponent } from 'react';
import { Box, TableCell, TableRow } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import { ColorChip, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';
import { Visit } from '../../types';
import { formatDate, muacColor, whzColor } from '../../utils';
import { SubmissionLink } from '../Fragments';

const useStyles = makeStyles(theme => ({
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
    assistances: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: theme.spacing(0.5),
    },
}));

type Props = {
    visit: Visit;
    programmeType?: string | null;
};

export const VisitRow: FunctionComponent<Props> = ({
    visit,
    programmeType,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const theme = useTheme();
    return (
        <TableRow>
            <TableCell>
                <Box component="span" className={classes.visitNumber}>
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
                                    programmeType,
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
                    <Box component="span" color="text.secondary">
                        {formatMessage(MESSAGES.no)}
                    </Box>
                )}
            </TableCell>
            <TableCell>{visit.entry_point ?? ''}</TableCell>
            <TableCell>
                {visit.steps.length === 0 ? (
                    <Box component="span" color="text.secondary">
                        {formatMessage(MESSAGES.none)}
                    </Box>
                ) : (
                    <Box className={classes.assistances}>
                        {visit.steps.map(step => (
                            <ColorChip
                                size="small"
                                key={step.id}
                                label={`${step.assistance_type}: ${step.quantity_given}${step.ration_size ? ` (${step.ration_size})` : ''}`}
                            />
                        ))}
                    </Box>
                )}
            </TableCell>
            <TableCell>
                {visit.instance_id && (
                    <SubmissionLink instanceId={visit.instance_id} />
                )}
            </TableCell>
        </TableRow>
    );
};
