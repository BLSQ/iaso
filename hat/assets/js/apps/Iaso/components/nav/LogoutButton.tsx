import React, { FunctionComponent } from 'react';
import ExitIcon from '@mui/icons-material/ExitToApp';
import { IconButton as MuiIconButton, Tooltip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl } from 'bluesquare-components';

import { useLogout } from 'Iaso/domains/users/hooks/useLogout';
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
    const { mutate: logout, isLoading: isLoggingOut } = useLogout();

    return (
        <Tooltip arrow title={formatMessage(MESSAGES.logout)}>
            <MuiIconButton
                className={classes.logoutButton}
                color={color}
                onClick={() => logout()}
                id="top-bar-logout-button"
                disabled={isLoggingOut}
            >
                <ExitIcon />
            </MuiIconButton>
        </Tooltip>
    );
};
