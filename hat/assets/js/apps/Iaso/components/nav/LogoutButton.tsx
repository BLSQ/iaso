import React, { FunctionComponent } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import ExitIcon from '@mui/icons-material/ExitToApp';
import { useSafeIntl } from 'bluesquare-components';

import MESSAGES from './messages';

const useStyles = makeStyles(theme => ({
    logoutButton: {
        padding: theme.spacing(0),
    },
}));

type Props = {
    color?: 'inherit' | 'primary' | 'secondary';
};

export const LogoutButton: FunctionComponent<Props> = ({
    color = 'inherit',
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <Tooltip arrow title={formatMessage(MESSAGES.logout)}>
            <IconButton
                className={classes.logoutButton}
                color={color}
                href="/logout-iaso"
                id="top-bar-logout-button"
            >
                <ExitIcon />
            </IconButton>
        </Tooltip>
    );
};
