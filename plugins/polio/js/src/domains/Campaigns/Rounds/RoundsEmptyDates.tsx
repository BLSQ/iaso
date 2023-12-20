import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Typography, Grid } from '@mui/material';
import MESSAGES from '../../constants/messages';

type Props = {
    roundErrors: Array<any>;
    roundValues: Array<any>;
};

export const RoundsEmptyDates: FunctionComponent<Props> = ({
    roundErrors,
    roundValues,
}) => {
    const { formatMessage } = useSafeIntl();
    const roundEmptyErrors: any[] = [];

    return (
        <Grid container justifyContent="flex-end">
            <Grid item md={6}>
                {roundErrors?.forEach((roundError, index) => {
                    const round = roundValues[index];
                    if (
                        roundError &&
                        (roundError.started_at || roundError.ended_at)
                    ) {
                        if (round) {
                            if (roundError.started_at) {
                                roundEmptyErrors.push(
                                    <Typography
                                        key={`round-${round.number}-start-date`}
                                        color="error"
                                    >
                                        {formatMessage(
                                            MESSAGES.roundEmptyStartDate,
                                            {
                                                roundNumber: round.number,
                                            },
                                        )}
                                    </Typography>,
                                );
                            }

                            if (roundError.ended_at) {
                                roundEmptyErrors.push(
                                    <Typography
                                        key={`round-${round.number}-end-date`}
                                        color="error"
                                    >
                                        {formatMessage(
                                            MESSAGES.roundEmptyEndDate,
                                            {
                                                roundNumber: round.number,
                                            },
                                        )}
                                    </Typography>,
                                );
                            }
                        }
                    }
                    return roundEmptyErrors;
                })}
                {roundEmptyErrors}
            </Grid>
        </Grid>
    );
};
