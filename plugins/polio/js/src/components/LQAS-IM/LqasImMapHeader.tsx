import React, { FunctionComponent } from 'react';
import { Typography, Box, makeStyles, Divider, Grid } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../constants/messages';
import { RoundString } from '../../constants/types';

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
    label: { fontWeight: 'bold' },
});

const useStyles = makeStyles(styles);
export const LqasImMapHeader: FunctionComponent<Props> = ({
    round,
    startDate = { date: '01/01/2022', isDefault: true },
    endDate = { date: '02/02/2022', isDefault: true },
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const startDateMessage = startDate.isDefault
        ? MESSAGES.startDateDefault
        : MESSAGES.startDate;
    const endDateMessage = endDate.isDefault
        ? MESSAGES.endDateDefault
        : MESSAGES.endDate;
    return (
        <Box>
            <Grid container direction="row">
                <Grid item xs={6}>
                    <Typography
                        variant="h5"
                        className={classes.lqasImMapHeader}
                        color="primary"
                    >
                        {`${formatMessage(MESSAGES[round])}`}
                    </Typography>
                </Grid>
                <Box>
                    <Divider orientation="vertical" />
                </Box>
                <Grid container item xs={5}>
                    <Grid
                        container
                        item
                        direction="row"
                        xs={6}
                        alignContent="center"
                    >
                        <Grid item className={classes.label}>
                            {`${formatMessage(startDateMessage)}`}
                        </Grid>
                        <Grid item>{`: ${startDate.date}`}</Grid>
                    </Grid>
                    <Grid
                        container
                        item
                        direction="row"
                        xs={6}
                        alignContent="center"
                    >
                        <Grid item className={classes.label}>
                            {`${formatMessage(endDateMessage)} `}
                        </Grid>
                        <Grid item>{`: ${endDate.date}`}</Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
};
