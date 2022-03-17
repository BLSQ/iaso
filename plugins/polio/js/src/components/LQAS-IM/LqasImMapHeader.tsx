import React, { FunctionComponent } from 'react';
import {
    Typography,
    Box,
    makeStyles,
    Divider,
    Grid,
    Tooltip,
} from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import MESSAGES from '../../constants/messages';
import { RoundString } from '../../constants/types';
import { OK_COLOR, WARNING_COLOR } from '../../styles/constants';

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
    label: {
        fontWeight: 'bold',
        marginLeft: theme.spacing(2),
        // paddingRight: theme.spacing(1),
        fontSize: '1rem',
    },
    infoIcon: {
        fontSize: 14,
        marginLeft: theme.spacing(1),
    },
    dateTextOK: {
        color: OK_COLOR,
        fontSize: '1rem',
        marginLeft: theme.spacing(2),
    },
    dateTextDefault: {
        color: WARNING_COLOR,
        fontSize: '1rem',
        marginLeft: theme.spacing(2),
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
                            <Grid item className={classes.label}>
                                {`${formatMessage(MESSAGES.startDate)}: `}
                            </Grid>
                            <Grid
                                item
                                className={
                                    startDate?.isDefault
                                        ? classes.dateTextDefault
                                        : classes.dateTextOK
                                }
                            >
                                {`${startDate.date}`}
                            </Grid>
                            {startDate?.isDefault && (
                                <Grid item>
                                    <Tooltip
                                        title={formatMessage(
                                            MESSAGES.lqasImDateTooltip,
                                        )}
                                    >
                                        <InfoOutlinedIcon
                                            className={classes.infoIcon}
                                        />
                                    </Tooltip>
                                </Grid>
                            )}
                        </Grid>
                        <Grid
                            container
                            item
                            direction="row"
                            xs={6}
                            alignItems="center"
                        >
                            <Grid item className={classes.label}>
                                {`${formatMessage(MESSAGES.endDate)}:`}
                            </Grid>
                            <Grid
                                item
                                className={
                                    startDate?.isDefault
                                        ? classes.dateTextDefault
                                        : classes.dateTextOK
                                }
                            >
                                {`${endDate.date}`}
                            </Grid>
                            {endDate.isDefault && (
                                <Grid item>
                                    <Tooltip
                                        title={formatMessage(
                                            MESSAGES.lqasImDateTooltip,
                                        )}
                                    >
                                        <InfoOutlinedIcon
                                            className={classes.infoIcon}
                                        />
                                    </Tooltip>
                                </Grid>
                            )}
                        </Grid>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};
