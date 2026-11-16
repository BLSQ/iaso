import React, { FunctionComponent } from 'react';
import { Box, TableCell, TableRow } from '@mui/material';
import { alpha, useTheme, Theme } from '@mui/material/styles';
import { ColorChip, useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';
import { Visit } from '../../types';
import { formatDate, muacColor, whzColor } from '../../utils';
import { SubmissionLink } from '../details/SubmissionLink';

const styles: SxStyles = {
    visitNumber: (theme: Theme) => ({
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
    }),
    muac: {
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        mr: 0.75,
        verticalAlign: 'middle',
    },
    assistances: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.5,
    },
    noWrap: {
        whiteSpace: 'nowrap',
    },
};

type Props = {
    visit: Visit;
    programmeType?: string | null;
};

export const VisitRow: FunctionComponent<Props> = ({
    visit,
    programmeType,
}) => {
    const { formatMessage } = useSafeIntl();
    const theme = useTheme();
    return (
        <TableRow>
            <TableCell>
                <Box component="span" sx={styles.visitNumber}>
                    {visit.number}
                </Box>
            </TableCell>
            <TableCell sx={styles.noWrap}>{formatDate(visit.date)}</TableCell>
            <TableCell>{visit.org_unit_name ?? ''}</TableCell>
            <TableCell sx={styles.noWrap}>
                {visit.muac_size && (
                    <>
                        <Box
                            component="span"
                            sx={{
                                ...styles.muac,
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
                    <Box sx={styles.assistances}>
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
