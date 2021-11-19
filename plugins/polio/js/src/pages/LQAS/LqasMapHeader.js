import React from 'react';
import { oneOf, number } from 'prop-types';
import { Typography, Box, Grid } from '@material-ui/core';
import { useSafeIntl, textPlaceholder } from 'bluesquare-components';
import MESSAGES from '../../constants/messages';

export const LqasMapHeader = ({
    round,
    evaluated,
    passedStrict,
    passedLax,
    failed,
}) => {
    const { formatMessage } = useSafeIntl();
    const percentRatio = data => {
        if (data && evaluated) {
            return (100 * (data / evaluated)).toFixed(2);
        }
        return 0;
    };
    return (
        <Grid container direction="row" spacing={2}>
            <Grid item>
                <Box>
                    <Typography variant="h5">
                        {`${formatMessage(MESSAGES[round])}:`}
                    </Typography>
                </Box>
            </Grid>
            <Grid item>
                <Box>
                    <Typography variant="h6">
                        {`${formatMessage(MESSAGES.evaluated)}: ${
                            evaluated ?? textPlaceholder
                        }`}
                    </Typography>
                </Box>
            </Grid>
            <Grid item>
                <Box>
                    <Typography variant="h6">
                        {`${formatMessage(MESSAGES.passing)}: `}
                        <span style={{ color: 'green' }}>
                            {`${passedStrict ?? textPlaceholder} `}
                        </span>
                        <span style={{ color: 'green' }}>
                            {`(${percentRatio(passedStrict)}%)`}
                        </span>
                    </Typography>
                </Box>
            </Grid>
            <Grid item>
                <Box>
                    <Typography variant="h6">
                        {`${formatMessage(MESSAGES.passingWithRatio)}: `}
                        <span style={{ color: 'limegreen' }}>
                            {`${passedLax ?? textPlaceholder}`}
                        </span>
                        <span style={{ color: 'limegreen' }}>
                            {`(${percentRatio(passedLax)}%)`}
                        </span>
                    </Typography>
                </Box>
            </Grid>
            <Grid item>
                <Box>
                    <Typography variant="h6">
                        {`${formatMessage(MESSAGES.failing)}: `}
                        <span style={{ color: 'red' }}>
                            {`${failed ?? textPlaceholder}`}
                        </span>
                        <span style={{ color: 'red' }}>
                            {`(${percentRatio(failed)}%)`}
                        </span>
                    </Typography>
                </Box>
            </Grid>
        </Grid>
    );
};

LqasMapHeader.propTypes = {
    round: oneOf(['round_1', 'round_2']).isRequired,
    evaluated: number,
    passedStrict: number,
    passedLax: number,
    failed: number,
};
LqasMapHeader.defaultProps = {
    evaluated: null,
    passedStrict: null,
    passedLax: null,
    failed: null,
};
