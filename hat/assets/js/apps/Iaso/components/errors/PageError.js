import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import {
    Paper, Container, Box, Typography, makeStyles,
} from '@material-ui/core';
import ErrorOutline from '@material-ui/icons/ErrorOutline';
import NotInterested from '@material-ui/icons/NotInterested';
import HelpOutline from '@material-ui/icons/HelpOutline';
import TopBar from '../nav/TopBarComponent';

const useStyles = makeStyles(theme => ({
    icon: {
        color: theme.palette.ligthGray.border,
        fontWeight: 'light',
        fontSize: 150,
    },
}));

const PageError = (props) => {
    const { errorCode } = props;
    const classes = useStyles();
    return (
        <>
            <TopBar
                displayBackButton={false}
            />
            <Box mt={5}>
                <Container maxWidth="md">
                    <Paper p={3}>
                        <Box py={6} px={2} justifyContent="center" alignItems="center" display="flex" flexDirection="column">
                            <Box pt={3}>
                                <Typography variant="h2">
                                    {errorCode}
                                </Typography>
                            </Box>
                            {
                                errorCode === '401'
                                && (
                                    <>
                                        <Box pt={2} pb={2}>
                                            <Typography variant="h5">
                                                <FormattedMessage
                                                    id="iaso.errors.notAuthorized"
                                                    defaultMessage="You are not authorized to view this page"
                                                />
                                            </Typography>
                                        </Box>
                                        <NotInterested className={classes.icon} />
                                    </>
                                )
                            }
                            {
                                errorCode === '404'
                                && (
                                    <>
                                        <Box pt={2} pb={2}>
                                            <Typography variant="h5">
                                                <FormattedMessage
                                                    id="iaso.errors.notFound"
                                                    defaultMessage="Page not found"
                                                />
                                            </Typography>
                                        </Box>
                                        <HelpOutline className={classes.icon} />
                                    </>
                                )
                            }
                            {
                                errorCode === '500'
                                && (
                                    <>
                                        <Box pt={2} pb={2}>
                                            <Typography variant="h5">
                                                <FormattedMessage
                                                    id="iaso.errors.label"
                                                    defaultMessage="An error occured"
                                                />
                                            </Typography>
                                        </Box>
                                        <ErrorOutline className={classes.icon} />
                                    </>
                                )
                            }
                        </Box>

                    </Paper>
                </Container>
            </Box>
        </>
    );
};

PageError.propTypes = {
    errorCode: PropTypes.string.isRequired,
};


export default PageError;
