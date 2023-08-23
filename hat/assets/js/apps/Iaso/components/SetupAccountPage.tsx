import React, { FunctionComponent } from 'react';
import { defineMessages } from 'react-intl';
import { makeStyles, Paper, Typography, Box } from '@material-ui/core';

import { useSafeIntl } from 'bluesquare-components';
import getDisplayName, { useCurrentUser } from '../utils/usersUtils';
import TopBar from './nav/TopBarComponent';
import InputComponent from './forms/InputComponent';

const useStyles = makeStyles(theme => ({
    paper: {
        margin: `${theme.spacing(4)}px auto`,
        width: 400,
        padding: theme.spacing(2),
    },
}));
export const MESSAGES = defineMessages({
    accountSetup: {
        defaultMessage: 'Account setup',
        id: 'iaso.setup.accountSetup',
    },
    accountName: {
        defaultMessage: 'Account name',
        id: 'iaso.setup.accountName',
    },
    notAdmin: {
        defaultMessage:
            'User {displayName} has no iaso_profile. Please contact your administrator.',
        id: 'iaso.setup.notAdmin',
    },
});

export const SetupAccount: FunctionComponent = () => {
    const currentUser = useCurrentUser();
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    return (
        <>
            <TopBar displayBackButton={false} displayMenuButton={false} />
            <Paper className={classes.paper}>
                {currentUser.is_superuser && (
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
                {!currentUser.is_superuser &&
                    formatMessage(MESSAGES.notAdmin, {
                        displayName: getDisplayName(currentUser),
                    })}
            </Paper>
        </>
    );
};
