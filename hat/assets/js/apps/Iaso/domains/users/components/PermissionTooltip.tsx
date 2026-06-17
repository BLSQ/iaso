import React from 'react';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import { Tooltip, Box } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import PERMISSIONS_MESSAGES from '../permissionsMessages';

type Props = {
    codename: string;
};

const PermissionTooltip: React.FunctionComponent<Props> = ({ codename }) => {
    let title;
    const { formatMessage } = useSafeIntl();
    const toolTipMessageObject = PERMISSIONS_MESSAGES[codename];
    if (toolTipMessageObject) {
        title = formatMessage(toolTipMessageObject);
    }
    return (
        <>
            {title && (
                <Box style={{ cursor: 'pointer' }}>
                    <Tooltip
                        title={title}
                        disableInteractive={false}
                        leaveDelay={500}
                        placement="left-start"
                        arrow
                    >
                        <HelpOutlineOutlinedIcon color="primary" />
                    </Tooltip>
                </Box>
            )}
        </>
    );
};

export default PermissionTooltip;
