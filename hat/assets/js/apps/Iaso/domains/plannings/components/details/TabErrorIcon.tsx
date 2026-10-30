import React, { FC } from 'react';
import ErrorSharpIcon from '@mui/icons-material/ErrorSharp';
import { Box, keyframes, Tooltip } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';

const shake = keyframes`
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-3px); }
    40%, 80% { transform: translateX(3px); }
`;

const styles = {
    icon: {
        display: 'flex',
        color: 'error.main',
        animation: `${shake} 0.4s ease-in-out`,
        '& svg': { fontSize: 'inherit' },
    },
} satisfies SxStyles;

type Props = {
    fieldsToFix: string[];
    // Set by Tab on its icon, keeps the tab icon size and spacing.
    className?: string;
};

export const TabErrorIcon: FC<Props> = ({ fieldsToFix, className }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Tooltip
            title={formatMessage(MESSAGES.fieldsToFix, {
                fields: fieldsToFix.join(', '),
            })}
        >
            <Box component="span" className={className} sx={styles.icon}>
                <ErrorSharpIcon />
            </Box>
        </Tooltip>
    );
};
