import React from 'react';
import { oneOf } from 'prop-types';
import { Typography, Box, Grid } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../constants/messages';

export const LqasMapHeader = ({ round }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Grid container direction="row" spacing={4}>
            <Grid item>
                <Box>
                    <Typography variant="h5">
                        {`${formatMessage(MESSAGES[round])}:`}
                    </Typography>
                </Box>
            </Grid>
            <Grid item>
                <Box>
                    <Typography variant="h6">Evaluated: 32</Typography>
                </Box>
            </Grid>
            <Grid item>
                <Box>
                    <Typography variant="h6">Passing LQAS: 32</Typography>
                </Box>
            </Grid>
            <Grid item>
                <Box>
                    <Typography variant="h6">With 57/60 ratio: 32</Typography>
                </Box>
            </Grid>
            <Grid item>
                <Box>
                    <Typography variant="h6">Failing: 32</Typography>
                </Box>
            </Grid>
        </Grid>
    );
};

LqasMapHeader.propTypes = {
    round: oneOf(['round_1', 'round_2']).isRequired,
};
