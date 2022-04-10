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
    // setting marginRight to prevent Divider from breaking the grid, marginLeft to prevent misalignment
    verticalDivider: { marginRight: -1, marginLeft: -1 },
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
                    <Divider
                        orientation="vertical"
                        className={classes.verticalDivider}
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
                        <Divider
                            orientation="vertical"
                            className={classes.verticalDivider}
                            flexItem
                        />
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
