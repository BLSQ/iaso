import React, { FunctionComponent } from 'react';
import { Grid, Typography } from '@mui/material';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import { Round } from '../../../../constants/types';
import MESSAGES from '../messages';
import { dateFormat } from '../../../Calendar/campaignCalendar/constants';

type Props = {
    round?: Round;
};

export const RoundDates: FunctionComponent<Props> = ({ round }) => {
    const { formatMessage } = useSafeIntl();

    return (
        <Grid container item xs={12}>
            <Grid container item xs={6} justifyContent="flex-start">
                <Grid item xs={4}>
                    <Typography variant="button">
                        {`${formatMessage(MESSAGES.startDate)}: `}
                    </Typography>
                </Grid>
                <Grid item xs={8}>
                    <Typography variant="button">
                        {`${
                            round?.started_at
                                ? moment(round.started_at).format(dateFormat)
                                : textPlaceholder
                        }`}
                    </Typography>
                </Grid>
            </Grid>
            <Grid container item xs={6}>
                <Grid item xs={4}>
                    <Typography variant="button">
                        {`${formatMessage(MESSAGES.endDate)}: `}
                    </Typography>
                </Grid>
                <Grid item xs={8}>
                    <Typography variant="button">
                        {`${
                            round?.ended_at
                                ? moment(round.ended_at).format(dateFormat)
                                : textPlaceholder
                        }`}
                    </Typography>
                </Grid>
            </Grid>
        </Grid>
    );
};
