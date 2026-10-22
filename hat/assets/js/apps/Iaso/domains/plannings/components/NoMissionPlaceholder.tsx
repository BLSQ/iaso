import React, { FC } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';

const styles = {
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        px: 4,
        py: 4,
    },
    illustration: {
        width: 220,
        maxWidth: '100%',
        mb: 3,
        color: 'grey.500',
    },
    title: {
        color: 'text.secondary',
        fontWeight: 'bold',
        mb: 1,
    },
    description: {
        color: 'text.disabled',
        maxWidth: 380,
    },
} satisfies SxStyles;

const MissionsIllustration: FC = () => (
    <Box
        component="svg"
        viewBox="0 0 220 140"
        sx={styles.illustration}
        aria-hidden
    >
        <ellipse cx="110" cy="130" rx="95" ry="7" fill="#F0F0F0" />
        <path
            d="M10 105 C25 95 40 100 70 103"
            fill="none"
            stroke="#CCC"
            strokeWidth="1.5"
            strokeDasharray="4 4"
        />
        <path
            d="M183 70 C182 85 175 90 165 95"
            fill="none"
            stroke="#CCC"
            strokeWidth="1.5"
            strokeDasharray="4 4"
        />
        <path
            d="M10 92 a7 7 0 1 1 14 0 c0 6 -7 13 -7 13 s-7 -7 -7 -13z"
            fill="#DDD"
        />
        <circle cx="17" cy="92" r="2.5" fill="#FFF" />
        <path
            d="M178 58 a8 8 0 1 1 16 0 c0 7 -8 14 -8 14 s-8 -7 -8 -14z"
            fill="#BBB"
        />
        <circle cx="186" cy="58" r="3" fill="#FFF" />
        <g transform="rotate(8 145 75)">
            <rect
                x="115"
                y="35"
                width="65"
                height="85"
                rx="4"
                fill="#F4F4F4"
                stroke="#DDD"
                strokeWidth="1.5"
            />
            <path
                d="M125 50h40M125 60h38M125 70h30"
                stroke="#DDD"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </g>
        <rect
            x="70"
            y="15"
            width="72"
            height="105"
            rx="5"
            fill="#FFF"
            stroke="#BBB"
            strokeWidth="2"
        />
        <rect
            x="93"
            y="6"
            width="26"
            height="15"
            rx="4"
            fill="#DDD"
            stroke="#BBB"
            strokeWidth="2"
        />
        <circle cx="106" cy="13" r="2.5" fill="#FFF" />
        <rect x="80" y="38" width="10" height="10" rx="2" fill="#999" />
        <path
            d="M82 43l2.5 2.5 4 -5"
            fill="none"
            stroke="#FFF"
            strokeWidth="1.8"
            strokeLinecap="round"
        />
        <path
            d="M96 43h34"
            stroke="#BBB"
            strokeWidth="3"
            strokeLinecap="round"
        />
        <rect
            x="80"
            y="58"
            width="10"
            height="10"
            rx="2"
            fill="none"
            stroke="#AAA"
            strokeWidth="1.8"
        />
        <path
            d="M96 63h24"
            stroke="#DDD"
            strokeWidth="3"
            strokeLinecap="round"
        />
        <rect
            x="80"
            y="78"
            width="10"
            height="10"
            rx="2"
            fill="none"
            stroke="#CCC"
            strokeWidth="1.5"
            strokeDasharray="2 2"
        />
        <path
            d="M96 83h28"
            stroke="#EEE"
            strokeWidth="3"
            strokeLinecap="round"
        />
        <circle
            cx="35"
            cy="35"
            r="14"
            fill="none"
            stroke="#BBB"
            strokeWidth="1.5"
            strokeDasharray="3 3"
        />
        <path
            d="M35 29v12M29 35h12"
            stroke="#999"
            strokeWidth="1.8"
            strokeLinecap="round"
        />
    </Box>
);

export const NoMissionPlaceholder: FC = () => {
    const { formatMessage } = useSafeIntl();
    return (
        <Stack sx={styles.container}>
            <MissionsIllustration />
            <Typography variant="h6" sx={styles.title}>
                {formatMessage(MESSAGES.noMissionLinked)}
            </Typography>
            <Typography variant="body1" sx={styles.description}>
                {formatMessage(MESSAGES.noMissionLinkedDescription)}
            </Typography>
        </Stack>
    );
};
