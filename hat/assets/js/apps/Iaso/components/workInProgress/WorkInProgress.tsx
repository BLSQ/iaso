import React, { FC, ReactNode } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { Box, Button, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { FormattedMessage } from 'react-intl';
import { UnderConstructionIllustration } from 'Iaso/components/svg/UnderConstructionIllustration';
import { SxStyles } from 'Iaso/types/general';
import { MESSAGES } from './messages';

const styles = {
    root: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 3,
        py: 6,
        px: 2,
        mx: 'auto',
        maxWidth: 600,
    },
    illustration: {
        width: '100%',
        maxWidth: 520,
        height: 'auto',
    },
    title: {
        fontWeight: 500,
        color: 'text.secondary',
    },
    description: {
        color: 'text.disabled',
    },
    release: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 1,
        borderRadius: 6,
        backgroundColor: theme => theme.palette.grey[100],
        color: 'text.secondary',
    },
} satisfies SxStyles;

type Props = {
    title?: ReactNode;
    description?: ReactNode;
    plannedRelease?: string;
    onBack?: () => void;
};

export const WorkInProgress: FC<Props> = ({
    title,
    description,
    plannedRelease,
    onBack,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Box sx={styles.root}>
            <UnderConstructionIllustration sx={styles.illustration} />
            <Typography variant="h5" component="h1" sx={styles.title}>
                {title ?? formatMessage(MESSAGES.title)}
            </Typography>
            <Typography variant="body1" sx={styles.description}>
                {description ?? formatMessage(MESSAGES.description)}
            </Typography>
            {plannedRelease && (
                <Box sx={styles.release}>
                    <CalendarTodayIcon fontSize="small" />
                    <Typography variant="body2">
                        <FormattedMessage
                            {...MESSAGES.plannedRelease}
                            values={{
                                release: <strong>{plannedRelease}</strong>,
                            }}
                        />
                    </Typography>
                </Box>
            )}
            {onBack && (
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={onBack}
                >
                    {formatMessage(MESSAGES.goBack)}
                </Button>
            )}
        </Box>
    );
};
