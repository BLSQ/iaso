/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Box, Container, Paper, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import Info from '@mui/icons-material/Info';
import { ClassNameMap } from 'notistack';
import TopBar from '../nav/TopBarComponent';

import MESSAGES from './messages';

const useStyles = makeStyles(() => ({
    icon: {
        fontWeight: 'lighter',
        fontSize: 150,
    },
}));

const PageNoPerms: React.FunctionComponent = () => {
    const classes = useStyles() as ClassNameMap<'icon'>;
    return (
        <>
            <TopBar displayBackButton={false} />
            <Box mt={5}>
                <Container maxWidth="md">
                    <Paper>
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
                                    <FormattedMessage
                                        {...MESSAGES.noPermissionsTitle}
                                    />
                                </Typography>
                            </Box>
                            <>
                                <Box pt={2} pb={2}>
                                    <Typography variant="h5">
                                        <FormattedMessage
                                            {...MESSAGES.noPermissions}
                                        />
                                    </Typography>
                                </Box>
                                <Info className={classes.icon} />
                            </>
                        </Box>
                    </Paper>
                </Container>
            </Box>
        </>
    );
};

export default PageNoPerms;
