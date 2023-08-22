import React, { FunctionComponent } from 'react';
import { makeStyles, Box } from '@material-ui/core';

import { commonStyles } from 'bluesquare-components';
import { useCurrentUser } from '../utils/usersUtils';
import TopBar from './nav/TopBarComponent';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export const SetupAccount: FunctionComponent = () => {
    const currentUser = useCurrentUser();
    const classes: Record<string, string> = useStyles();
    return (
        <>
            <TopBar
                displayBackButton={false}
                displayMenuButton={false}
                title="SETUP"
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                {currentUser.is_superuser && (
                    <> SETUP ACCOUNT {currentUser.user_name}</>
                )}
                {!currentUser.is_superuser && <> No account for this user</>}
            </Box>
        </>
    );
};
