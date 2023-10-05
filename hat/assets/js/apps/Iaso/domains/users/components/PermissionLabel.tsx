import { Tooltip, Grid } from '@material-ui/core';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import React from 'react';
import { useSafeIntl } from 'bluesquare-components';
import PERMISSIONS_MESSAGES from '../permissionsMessages';

type Props = {
    codename: string;
    name: string;
};

const PermissionLabel: React.FunctionComponent<Props> = ({
    codename,
    name,
}) => {
    let title;
    const { formatMessage } = useSafeIntl();
    const toolTipMessageObject = PERMISSIONS_MESSAGES[codename];
    if (toolTipMessageObject) {
        title = formatMessage(toolTipMessageObject);
    }
    return (
        <Grid container direction="row" spacing={2}>
            <Grid item xs={2}>
                {title && (
                    <Tooltip
                        title={title}
                        interactive
                        leaveDelay={500}
                        placement="left-start"
                        arrow
                    >
                        <HelpOutlineIcon color="primary" />
                    </Tooltip>
                )}
            </Grid>
            <Grid item xs={10}>
                <span>{name}</span>
            </Grid>
        </Grid>
    );
};

export default PermissionLabel;
