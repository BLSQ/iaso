import React, { FunctionComponent } from 'react';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Grid, Tooltip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../../constants/messages';
import { OK_COLOR, FAIL_COLOR } from '../../../../styles/constants';
import { LqasImRefDate } from '../../types';

type Props = {
    type: 'start' | 'end';
    date: LqasImRefDate;
};

const styles = theme => ({
    labelStart: {
        fontWeight: 'bold',
        marginLeft: `${theme.spacing(2)} !important`,
        fontSize: '1rem',
        paddingBottom: `${theme.spacing(2)} !important`,
    },
    labelEnd: {
        fontWeight: 'bold',
        marginLeft: `${theme.spacing(2)} !important`,
        fontSize: '1rem',
        paddingBottom: `${theme.spacing(2)} !important`,
    },
    infoIcon: {
        fontSize: 14,
        marginLeft: '4px',
    },
    dateTextOK: {
        color: OK_COLOR,
        fontSize: '1rem',
        marginLeft: `${theme.spacing(2)} !important`,
    },
    dateTextDefault: {
        color: FAIL_COLOR,
        fontSize: '1rem',
        marginLeft: `${theme.spacing(2)} !important`,
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
