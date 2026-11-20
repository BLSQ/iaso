import React from 'react';

import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Box from '@mui/material/Box/Box';
import Tooltip from '@mui/material/Tooltip/Tooltip';

type Props = {
    iconVariant: 'warning' | 'info';
    title: string;
};

export const FeatureFlagTooltipCell: React.FunctionComponent<Props> = ({
    iconVariant = 'info',
    title,
}) => {
    return (
        <Box style={{ cursor: 'pointer' }}>
            <Tooltip
                title={title}
                disableInteractive={false}
                leaveDelay={500}
                placement="left-start"
                arrow
            >
                {iconVariant === 'warning' ? (
                    <WarningAmberIcon color="warning" />
                ) : (
                    <HelpOutlineIcon color="primary" />
                )}
            </Tooltip>
        </Box>
    );
};
