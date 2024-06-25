import React, { FunctionComponent } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import { Round } from '../../../../constants/types';
import MESSAGES from '../messages';
import { dateFormat } from '../../../Calendar/campaignCalendar/constants';
import { CreateSubActivity } from './Modal/CreateEditSubActivity';

type Props = {
    round?: Round;
};

export const SubActivitiesInfos: FunctionComponent<Props> = ({ round }) => {
    const { formatMessage } = useSafeIntl();

    return (
        <Grid container>
            <Grid item xs={8}>
                <Box ml={2} mb={2} mt={2}>
                    <Grid container>
                        <Grid item xs={3} xl={2}>
                            <Typography variant="button">
                                {`${formatMessage(MESSAGES.startDate)}: `}
                            </Typography>
                        </Grid>
                        <Grid item xs={9} xl={10}>
                            <Typography variant="button">
                                {`${
                                    round?.started_at
                                        ? moment(round.started_at).format(
                                              dateFormat,
                                          )
                                        : textPlaceholder
                                }`}
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>

                <Box ml={2} mb={2}>
                    <Grid container>
                        <Grid item xs={3} xl={2}>
                            <Typography variant="button">
                                {`${formatMessage(MESSAGES.endDate)}: `}
                            </Typography>
                        </Grid>
                        <Grid item xs={9} xl={10}>
                            <Typography variant="button">
                                {`${
                                    round?.ended_at
                                        ? moment(round.ended_at).format(
                                              dateFormat,
                                          )
                                        : textPlaceholder
                                }`}
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>
            </Grid>
            <Grid
                container
                item
                xs={4}
                alignContent="center"
                justifyContent="flex-end"
            >
                <CreateSubActivity iconProps={{}} round={round} />
            </Grid>
        </Grid>
    );
};
