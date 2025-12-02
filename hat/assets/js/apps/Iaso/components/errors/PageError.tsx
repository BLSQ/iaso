import React, { FunctionComponent } from 'react';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import HelpOutline from '@mui/icons-material/HelpOutline';
import NotAuthorized from '@mui/icons-material/NotInterested';
import { Paper, Container, Box, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';

import { FormattedMessage } from 'react-intl';
import TopBar from '../nav/TopBarComponent';

import MESSAGES from './messages';

const useStyles = makeStyles(theme => ({
    icon: {
        //@ts-ignore
        color: theme.palette.ligthGray.border,
        fontWeight: 'light',
        fontSize: 150,
    },
}));

type Props = {
    errorCode: string;
    displayMenuButton?: boolean;
    customMessage?: string;
};

const PageError: FunctionComponent<Props> = ({
    errorCode,
    displayMenuButton = true,
    customMessage,
}) => {
    const classes = useStyles();
    return (
        <>
            <TopBar
                displayBackButton={false}
                displayMenuButton={displayMenuButton}
            />
            <Box mt={5}>
                <Container maxWidth="md">
                    {/* p prop is unknonw. Check it doesn't break the page before removing */}
                    {/* @ts-ignore */}
                    <Paper p={3}>
                        <Box
                            py={6}
                            px={2}
                            justifyContent="center"
                            alignItems="center"
                            display="flex"
                            flexDirection="column"
                        >
                            <Box pt={3}>
                                <Typography variant="h2" id="error-code">
                                    {errorCode}
                                </Typography>
                            </Box>
                            {customMessage && (
                                <Box pt={2} pb={2}>
                                    <Typography variant="h5">
                                        {customMessage}
                                    </Typography>
                                </Box>
                            )}
                            {!customMessage && (
                                <>
                                    {errorCode === '401' && (
                                        <>
                                            <Box pt={2} pb={2}>
                                                <Typography variant="h5">
                                                    <FormattedMessage
                                                        {...MESSAGES.notAuthenticated}
                                                    />
                                                </Typography>
                                            </Box>
                                            <NotAuthorized
                                                className={classes.icon}
                                            />
                                        </>
                                    )}
                                    {errorCode === '403' && (
                                        <>
                                            <Box pt={2} pb={2}>
                                                <Typography variant="h5">
                                                    <FormattedMessage
                                                        {...MESSAGES.unauthorized}
                                                    />
                                                </Typography>
                                            </Box>
                                            <NotAuthorized
                                                className={classes.icon}
                                            />
                                        </>
                                    )}
                                    {errorCode === '404' && (
                                        <>
                                            <Box pt={2} pb={2}>
                                                <Typography variant="h5">
                                                    <FormattedMessage
                                                        {...MESSAGES.notFound}
                                                    />
                                                </Typography>
                                            </Box>
                                            <HelpOutline
                                                className={classes.icon}
                                            />
                                        </>
                                    )}
                                    {errorCode === '500' && (
                                        <>
                                            <Box pt={2} pb={2}>
                                                <Typography variant="h5">
                                                    <FormattedMessage
                                                        {...MESSAGES.labelError}
                                                    />
                                                </Typography>
                                            </Box>
                                            <ErrorOutline
                                                className={classes.icon}
                                            />
                                        </>
                                    )}
                                </>
                            )}
                        </Box>
                    </Paper>
                </Container>
            </Box>
        </>
    );
};

export default PageError;
