import React, { FunctionComponent, useEffect } from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import { ExternalLink, useSafeIntl } from 'bluesquare-components';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { useStyles } from '../../../styles/theme';
import MESSAGES from './messages';

export const PerformanceDashboard: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    useEffect(() => {
        window.location.replace(
            'https://www.poliooutbreaks.com/pages/performance_indicator-en-fr/',
        );
    }, []);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.performanceDashboard)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Box mt={5}>
                    <Container maxWidth="lg">
                        <Paper>
                            <Box
                                py={6}
                                px={2}
                                justifyContent="center"
                                alignItems="center"
                                display="flex"
                                flexDirection="column"
                            >
                                <Box pt={2} pb={2}>
                                    <Typography variant="h5">
                                        {formatMessage(
                                            MESSAGES.followLinkBelow,
                                        )}
                                    </Typography>
                                </Box>
                                <Box pt={2} pb={2}>
                                    <ExternalLink url="https://www.poliooutbreaks.com/pages/performance_indicator/">
                                        <Typography variant="h5">
                                            {formatMessage(
                                                MESSAGES.performanceDashboard,
                                            )}
                                        </Typography>
                                    </ExternalLink>
                                </Box>
                            </Box>
                        </Paper>
                    </Container>
                </Box>
            </Box>
        </>
    );
};
