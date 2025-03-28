import React, { FunctionComponent } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl } from 'bluesquare-components';
import { Credentials } from '../../orgUnits/types/dataSources';
import MESSAGES from '../messages';

const style = theme => ({
    noCreds: {
        color: theme.palette.error.main,
    },
    subtitle: {
        fontWeight: 'bold',
        color: theme.palette.primary.main,
    },
});

const useStyles = makeStyles(style);

type Props = {
    credentials?: Credentials;
};

export const Dhis2Credentials: FunctionComponent<Props> = ({ credentials }) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();

    if (!credentials) {
        return null;
    }
    return (
        <Grid xs={12} item>
            <Box display="flex" alignItems="center">
                <Typography variant="subtitle1" className={classes.subtitle}>
                    {formatMessage(MESSAGES.credentialsForExport)}
                </Typography>
                {credentials?.is_valid && (
                    <Typography variant="body1">
                        {credentials.name
                            ? `: ${credentials.name} (${credentials.url})`
                            : `: ${credentials.url}`}
                    </Typography>
                )}
                {!credentials?.is_valid && (
                    <Typography variant="body1" className={classes.noCreds}>
                        {`: ${formatMessage(MESSAGES.noCredentialsForExport)}`}
                    </Typography>
                )}
            </Box>
        </Grid>
    );
};
