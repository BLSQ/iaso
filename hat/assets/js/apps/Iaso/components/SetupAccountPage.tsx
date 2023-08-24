import React, { FunctionComponent } from 'react';
import { defineMessages } from 'react-intl';
import { makeStyles, Paper, Typography, Box } from '@material-ui/core';
import ContactSupportIcon from '@material-ui/icons/ContactSupport';

import { useSafeIntl } from 'bluesquare-components';
import getDisplayName, { useCurrentUser } from '../utils/usersUtils';
import TopBar from './nav/TopBarComponent';
import InputComponent from './forms/InputComponent';

const useStyles = makeStyles(theme => ({
    paper: {
        margin: `${theme.spacing(4)}px auto`,
        width: 500,
        padding: theme.spacing(2),
    },
    icon: {
        // @ts-ignore
        color: theme.palette.ligthGray.border,
        fontWeight: 100,
        fontSize: 150,
    },
}));
export const MESSAGES = defineMessages({
    welcome: {
        defaultMessage: 'Welcome to Iaso',
        id: 'iaso.setup.welcome',
    },
    accountSetup: {
        defaultMessage: 'Account setup',
        id: 'iaso.setup.accountSetup',
    },
    accountName: {
        defaultMessage: 'Account name',
        id: 'iaso.setup.accountName',
    },
    notAdmin: {
        defaultMessage: 'User "{displayName}" has no iaso profile and account.',
        id: 'iaso.setup.notAdmin',
    },
    notAdmin2: {
        defaultMessage: 'Please contact your administrator.',
        id: 'iaso.setup.notAdmin2',
    },
});

export const SetupAccount: FunctionComponent = () => {
    const currentUser = useCurrentUser();
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const isAdmin = currentUser.is_superuser || currentUser.is_staff;
    return (
        <>
            <TopBar
                displayBackButton={false}
                displayMenuButton={false}
                title={formatMessage(MESSAGES.welcome)}
            />
            <Paper className={classes.paper}>
                {isAdmin && (
                    <>
                        <Typography variant="h5" color="primary">
                            {formatMessage(MESSAGES.accountSetup)}
                        </Typography>
                        <Box>
                            <InputComponent
                                type="text"
                                keyValue="accountName"
                                labelString={formatMessage(
                                    MESSAGES.accountName,
                                )}
                                value=""
                                onChange={() => null}
                            />
                        </Box>
                    </>
                )}
                {!isAdmin && (
                    <Box textAlign="center">
                        <Box
                            pt={2}
                            pb={2}
                            display="flex"
                            justifyContent="center"
                            flexDirection="column"
                        >
                            <Typography variant="h6">
                                {formatMessage(MESSAGES.notAdmin, {
                                    displayName: getDisplayName(currentUser),
                                })}
                            </Typography>
                            <Typography>
                                {formatMessage(MESSAGES.notAdmin2)}
                            </Typography>
                        </Box>
                        <ContactSupportIcon className={classes.icon} />
                    </Box>
                )}
            </Paper>
        </>
    );
};
