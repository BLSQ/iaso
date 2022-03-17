import { makeStyles, Grid, Tooltip } from '@material-ui/core';
import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import MESSAGES from '../../constants/messages';
import { OK_COLOR, WARNING_COLOR } from '../../styles/constants';
import { LqasImRefDate } from './LqasImMapHeader';

type Props = {
    type: 'start' | 'end';
    date: LqasImRefDate;
};

const styles = theme => ({
    label: {
        fontWeight: 'bold',
        marginLeft: theme.spacing(2),
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

export const LqasImDates: FunctionComponent<Props> = ({ type, date }) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const label = type === 'start' ? MESSAGES.startDate : MESSAGES.endDate;
    return (
        <>
            <Grid item className={classes.label}>
                {`${formatMessage(label)}: `}
            </Grid>
            <Grid
                item
                className={
                    date?.isDefault
                        ? classes.dateTextDefault
                        : classes.dateTextOK
                }
            >
                {`${date.date}`}
            </Grid>
            {date?.isDefault && (
                <Grid item>
                    <Tooltip title={formatMessage(MESSAGES.lqasImDateTooltip)}>
                        <InfoOutlinedIcon className={classes.infoIcon} />
                    </Tooltip>
                </Grid>
            )}
        </>
    );
};
