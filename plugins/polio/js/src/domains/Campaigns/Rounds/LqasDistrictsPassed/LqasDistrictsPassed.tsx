import React, { FunctionComponent } from 'react';
import { Box, Divider, Grid, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../../constants/messages';
import { Nullable } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';

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
            <Box ml={2} mb={2} mt={2}>
                <Grid container justifyContent="flex-start">
                    <Grid item xs={6} lg={5}>
                        <Typography variant="button">
                            {`${formatMessage(
                                MESSAGES.lqas_district_passing,
                            )}: `}
                        </Typography>
                    </Grid>
                    <Grid item xs={6} lg={7}>
                        <Typography variant="button">
                            {`${lqasDistrictsPassing ?? '--'}`}
                        </Typography>
                    </Grid>
                </Grid>
            </Box>
            <Box ml={2} mb={2} mt={2}>
                <Grid container>
                    <Grid item xs={6} lg={5}>
                        <Typography variant="button">
                            {`${formatMessage(
                                MESSAGES.lqas_district_failing,
                            )}: `}
                        </Typography>
                    </Grid>
                    <Grid item xs={6} lg={7}>
                        <Typography variant="button">
                            {`${lqasDistrictsFailing ?? '--'}`}
                        </Typography>
                    </Grid>
                </Grid>
            </Box>
            <Box mb={2}>
                <Divider />
            </Box>
        </>
    );
};
