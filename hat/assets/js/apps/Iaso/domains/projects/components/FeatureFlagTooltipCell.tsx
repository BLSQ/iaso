import React from 'react';

import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Box, Tooltip } from '@mui/material';

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
                    <HelpOutlineOutlinedIcon color="primary" />
                )}
            </Tooltip>
        </Box>
    );
};
