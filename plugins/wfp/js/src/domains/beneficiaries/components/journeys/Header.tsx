import React, { FunctionComponent } from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ColorChip, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';
import { Journey } from '../../types';
import { exitColor, formatDate, programmeColor } from '../../utils';

export const Header: FunctionComponent<{
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
            <ColorChip
                size="small"
                color={color}
                label={programme || formatMessage(MESSAGES.noProgramme)}
            />
            {journey.programme_type && (
                <ColorChip size="small" label={journey.programme_type} />
            )}
            {journey.physiology_status && (
                <ColorChip size="small" label={journey.physiology_status} />
            )}
            {journey.admission_type && (
                <ColorChip
                    size="small"
                    label={formatMessage(MESSAGES.admission, {
                        admissionType: journey.admission_type,
                    })}
                />
            )}
            {journey.admission_criteria && (
                <ColorChip
                    size="small"
                    label={formatMessage(MESSAGES.admissionCriteria, {
                        admissionCriteria: journey.admission_criteria,
                    })}
                />
            )}
            {journey.exit_type ? (
                <ColorChip
                    size="small"
                    color={exitColor(theme, journey.exit_type)}
                    label={formatMessage(MESSAGES.exit, {
                        exitType: journey.exit_type,
                    })}
                />
            ) : (
                <ColorChip
                    size="small"
                    color={theme.palette.success.main}
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
