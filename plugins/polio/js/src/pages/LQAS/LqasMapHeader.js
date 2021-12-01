import React from 'react';
import { oneOf, number } from 'prop-types';
import { Typography, Box, Grid } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../constants/messages';
import { LqasStatsBar } from './LqasStatsBar';

export const LqasMapHeader = ({
    round,
    evaluated,
    passed,
    disqualified,
    failed,
}) => {
    const { formatMessage } = useSafeIntl();

    return (
        <>
            {/* <Grid container direction="row" justifyContent="flex-start" spacing={2}>
             <Grid item xs={3} lg={2}> */}
            <Box>
                <Typography variant="h5">
                    {`${formatMessage(MESSAGES[round])}:`}
                </Typography>
            </Box>
            {/* </Grid> */}
            <Grid container direction="column">
                <LqasStatsBar
                    message={formatMessage(MESSAGES.passing)}
                    data={passed}
                    total={evaluated}
                    color="green"
                />
                <LqasStatsBar
                    message={formatMessage(MESSAGES.disqualified)}
                    data={disqualified}
                    total={evaluated}
                    color="orange"
                />
                <LqasStatsBar
                    message={formatMessage(MESSAGES.failing)}
                    data={failed}
                    total={evaluated}
                    color="red"
                />
            </Grid>
            {/* </Grid> */}
        </>
    );
};

LqasMapHeader.propTypes = {
    round: oneOf(['round_1', 'round_2']).isRequired,
    evaluated: number,
    passed: number,
    disqualified: number,
    failed: number,
};
LqasMapHeader.defaultProps = {
    evaluated: null,
    passed: null,
    disqualified: null,
    failed: null,
};
