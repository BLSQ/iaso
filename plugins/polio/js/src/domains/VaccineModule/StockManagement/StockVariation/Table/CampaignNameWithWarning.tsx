import React, { FunctionComponent } from 'react';
import { REGULAR, ROUND_ON_HOLD } from '../../constants';
import { Box, Tooltip } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import MESSAGES from '../../messages';

type Props = {
    text: string;
    category: string;
    isVrf?: boolean;
};

export const CampaignNameWithWarning: FunctionComponent<Props> = ({
    text,
    category,
    isVrf = false,
}) => {
    const { formatMessage } = useSafeIntl();
    if (category === REGULAR) return <span>{text}</span>;
    const title =
        isVrf && category === ROUND_ON_HOLD
            ? formatMessage(MESSAGES.roundsOnHold)
            : formatMessage(MESSAGES[category]);
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
                title={title}
            >
                <WarningAmberOutlinedIcon />
            </Tooltip>
            <span>{text}</span>
        </Box>
    );
};
