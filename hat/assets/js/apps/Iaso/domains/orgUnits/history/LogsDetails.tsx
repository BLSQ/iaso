import React, { FunctionComponent } from 'react';
import {
    LoadingSpinner,
    commonStyles,
    useSafeIntl,
} from 'bluesquare-components';
import { Container, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import LogCompareComponent from './LogCompareComponent';
import MESSAGES from './messages';
import { useGetLogDetails } from '../../../hooks/useGetLogDetails';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    root: {
        cursor: 'default',
        paddingBottom: theme.spacing(4),
        paddingTop: theme.spacing(4),
    },
}));

type Props = {
    goToRevision: any;
    logId: string | number;
};

export const LogsDetails: FunctionComponent<Props> = ({
    goToRevision,
    logId,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const { data: log, isFetching: loading } = useGetLogDetails(logId);
    return (
        <Container maxWidth={false} className={classes.root}>
            {loading && <LoadingSpinner />}
            {log && (
                <>
                    {log.past_value.length > 0 && log.new_value.length > 0 && (
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <LogCompareComponent
                                    title={formatMessage(MESSAGES.before)}
                                    log={log.past_value}
                                    compareLog={log.new_value}
                                    goToRevision={goToRevision}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <LogCompareComponent
                                    title={formatMessage(MESSAGES.after)}
                                    log={log.new_value}
                                    compareLog={log.past_value}
                                    goToRevision={goToRevision}
                                    isNewValue
                                />
                            </Grid>
                        </Grid>
                    )}
                    {log.past_value.length > 0 &&
                        log.new_value.length === 0 && (
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <h4 className="margin-bottom">
                                        {formatMessage(MESSAGES.deleted)}
                                    </h4>
                                    <LogCompareComponent log={log.past_value} />
                                </Grid>
                            </Grid>
                        )}
                    {log.past_value.length === 0 &&
                        log.new_value.length > 0 && (
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <h4 className="margin-bottom">
                                        {formatMessage(MESSAGES.created)}
                                    </h4>
                                    <LogCompareComponent
                                        log={log.new_value}
                                        goToRevision={goToRevision}
                                    />
                                </Grid>
                            </Grid>
                        )}
                </>
            )}
        </Container>
    );
};
