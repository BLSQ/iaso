import React, { FunctionComponent } from 'react';
import { REGULAR } from '../../constants';
import { Box, Tooltip } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import MESSAGES from '../../messages';

type Props = {
    text: string;
    category: string;
};

export const CampaignNameWithWarning: FunctionComponent<Props> = ({
    text,
    category,
}) => {
    const { formatMessage } = useSafeIntl();
    if (category === REGULAR) return <span>{text}</span>;

    return (
        <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={theme => theme.spacing(2)}
        >
            <Tooltip
                sx={{
                    color: theme => theme.palette.warning.main,
                    display: 'flex',
                    alignItems: 'center',
                }}
                title={formatMessage(MESSAGES[category])}
            >
                <WarningAmberOutlinedIcon />
            </Tooltip>
            <span>{text}</span>
        </Box>
    );
};
