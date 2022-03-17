import React, { FunctionComponent } from 'react';
import { Typography, Box, makeStyles, Divider, Grid } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../constants/messages';
import { RoundString } from '../../constants/types';
import { LqasImDates } from './LqasImDates';

export type LqasImRefDate = {
    date: string;
    isDefault: boolean;
};

type Props = {
    round: RoundString;
    startDate: LqasImRefDate;
    endDate: LqasImRefDate;
};

const styles = theme => ({
    lqasImMapHeader: {
        padding: theme.spacing(2),
        fontWeight: 'bold',
    },
});

const useStyles = makeStyles(styles);
export const LqasImMapHeader: FunctionComponent<Props> = ({
    round,
    startDate,
    endDate,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <Box>
            {startDate && endDate && (
                <Grid container direction="row">
                    <Grid container item xs={6} direction="row">
                        <Typography
                            variant="h5"
                            className={classes.lqasImMapHeader}
                            color="primary"
                        >
                            {`${formatMessage(MESSAGES[round])}`}
                        </Typography>
                    </Grid>
                    {/* setting marginRight to prevent Divider from breaking the grid */}
                    <Divider
                        orientation="vertical"
                        style={{ marginRight: '-1px' }}
                        flexItem
                    />
                    <Grid container item xs={6}>
                        <Grid
                            container
                            item
                            direction="row"
                            xs={6}
                            alignItems="center"
                        >
                            <LqasImDates type="start" date={startDate} />
                        </Grid>
                        <Grid
                            container
                            item
                            direction="row"
                            xs={6}
                            alignItems="center"
                        >
                            <LqasImDates type="end" date={endDate} />
                        </Grid>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};
