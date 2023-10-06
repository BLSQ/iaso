import { Tooltip, Box } from '@material-ui/core';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import React from 'react';
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
                        interactive
                        leaveDelay={500}
                        placement="left-start"
                        arrow
                    >
                        <HelpOutlineIcon color="primary" />
                    </Tooltip>
                </Box>
            )}
        </>
    );
};

export default PermissionTooltip;
