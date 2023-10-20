import { makeStyles, Grid, Tooltip } from '@material-ui/core';
import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import MESSAGES from '../../../constants/messages';
import { OK_COLOR, FAIL_COLOR } from '../../../styles/constants';
import { LqasImRefDate } from './LqasImMapHeader';

type Props = {
    type: 'start' | 'end';
    date: LqasImRefDate;
};

const styles = theme => ({
    labelStart: {
        fontWeight: 'bold',
        marginLeft: theme.spacing(2),
        fontSize: '1rem',
        paddingBottom: theme.spacing(2),
    },
    labelEnd: {
        fontWeight: 'bold',
        marginLeft: theme.spacing(2),
        fontSize: '1rem',
        paddingBottom: theme.spacing(2),
    },
    infoIcon: {
        fontSize: 14,
        marginLeft: '4px',
    },
    dateTextOK: {
        color: OK_COLOR,
        fontSize: '1rem',
        marginLeft: theme.spacing(2),
    },
    dateTextDefault: {
        color: FAIL_COLOR,
        fontSize: '1rem',
        marginLeft: theme.spacing(2),
    },
});
// @ts-ignore
const useStyles = makeStyles(styles);

export const LqasImDates: FunctionComponent<Props> = ({ type, date }) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const label = type === 'start' ? MESSAGES.startDate : MESSAGES.endDate;
    const displayedDate = date?.date ?? formatMessage(MESSAGES.noDateFound);
    const isDateOk = date && !date?.isDefault;
    return (
        <>
            <Grid
                item
                className={
                    type === 'start' ? classes.labelStart : classes.labelEnd
                }
                xs={12}
            >
                {`${formatMessage(label)}: `}
            </Grid>
            <Grid
                item
                className={
                    isDateOk ? classes.dateTextOK : classes.dateTextDefault
                }
            >
                {`${displayedDate}`}
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
