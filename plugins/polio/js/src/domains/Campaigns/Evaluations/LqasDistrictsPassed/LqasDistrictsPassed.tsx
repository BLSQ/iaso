import React, { FunctionComponent } from 'react';
import { Box, Divider, Grid, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { Nullable } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import MESSAGES from '../../../../constants/messages';

type Props = {
    lqasDistrictsPassing?: Nullable<number>;
    lqasDistrictsFailing?: Nullable<number>;
};

export const LqasDistrictsPassed: FunctionComponent<Props> = ({
    lqasDistrictsPassing,
    lqasDistrictsFailing,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <>
            <Divider />
            <Box
                sx={{
                    ml: 2,
                    mb: 2,
                    mt: 2,
                }}
            >
                <Grid
                    container
                    sx={{
                        justifyContent: 'flex-start',
                    }}
                >
                    <Grid
                        size={{
                            xs: 6,
                            lg: 5,
                        }}
                    >
                        <Typography variant="button">
                            {`${formatMessage(
                                MESSAGES.lqas_district_passing,
                            )}: `}
                        </Typography>
                    </Grid>
                    <Grid
                        size={{
                            xs: 6,
                            lg: 7,
                        }}
                    >
                        <Typography variant="button">
                            {`${lqasDistrictsPassing ?? '--'}`}
                        </Typography>
                    </Grid>
                </Grid>
            </Box>
            <Box
                sx={{
                    ml: 2,
                    mb: 2,
                    mt: 2,
                }}
            >
                <Grid container>
                    <Grid
                        size={{
                            xs: 6,
                            lg: 5,
                        }}
                    >
                        <Typography variant="button">
                            {`${formatMessage(
                                MESSAGES.lqas_district_failing,
                            )}: `}
                        </Typography>
                    </Grid>
                    <Grid
                        size={{
                            xs: 6,
                            lg: 7,
                        }}
                    >
                        <Typography variant="button">
                            {`${lqasDistrictsFailing ?? '--'}`}
                        </Typography>
                    </Grid>
                </Grid>
            </Box>
            <Box
                sx={{
                    mb: 2,
                }}
            >
                <Divider />
            </Box>
        </>
    );
};
