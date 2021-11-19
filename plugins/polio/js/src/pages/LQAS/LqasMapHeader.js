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
                        {`${formatMessage(MESSAGES.passing)}: ${
                            passedStrict ?? textPlaceholder
                        }`}
                    </Typography>
                </Box>
            </Grid>
            <Grid item>
                <Box>
                    <Typography variant="h6">
                        {`${formatMessage(MESSAGES.passingWithRatio)}: ${
                            passedLax ?? textPlaceholder
                        }`}
                    </Typography>
                </Box>
            </Grid>
            <Grid item>
                <Box>
                    <Typography variant="h6">
                        {`${formatMessage(MESSAGES.failing)}: ${
                            failed ?? textPlaceholder
                        }`}
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
