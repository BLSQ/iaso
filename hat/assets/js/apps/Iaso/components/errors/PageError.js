import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Paper, Container, Box, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import NotAuthorized from '@mui/icons-material/NotInterested';
import HelpOutline from '@mui/icons-material/HelpOutline';
import TopBar from '../nav/TopBarComponent';

import MESSAGES from './messages';

const useStyles = makeStyles(theme => ({
    icon: {
        color: theme.palette.ligthGray.border,
        fontWeight: 'light',
        fontSize: 150,
    },
}));

const PageError = ({ errorCode, displayMenuButton }) => {
    const classes = useStyles();
    return (
        <>
            <TopBar
                displayBackButton={false}
                displayMenuButton={displayMenuButton}
            />
            <Box mt={5}>
                <Container maxWidth="md">
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
                            {errorCode === '401' && (
                                <>
                                    <Box pt={2} pb={2}>
                                        <Typography variant="h5">
                                            <FormattedMessage
                                                {...MESSAGES.notAuthenticated}
                                            />
                                        </Typography>
                                    </Box>
                                    <NotAuthorized className={classes.icon} />
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
                                    <NotAuthorized className={classes.icon} />
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
                                    <HelpOutline className={classes.icon} />
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
                                    <ErrorOutline className={classes.icon} />
                                </>
                            )}
                        </Box>
                    </Paper>
                </Container>
            </Box>
        </>
    );
};

PageError.defaultProps = {
    displayMenuButton: true,
};

PageError.propTypes = {
    errorCode: PropTypes.string.isRequired,
    displayMenuButton: PropTypes.bool,
};

export default PageError;
