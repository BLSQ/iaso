import { Container, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    LoadingSpinner,
    commonStyles,
    useSafeIntl,
} from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { useGetLogDetails } from '../../../hooks/useGetLogDetails';
import MESSAGES from '../messages';
import { UserLogCompare } from './UserLogCompare';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    root: {
        cursor: 'default',
        paddingBottom: theme.spacing(4),
        paddingTop: theme.spacing(4),
    },
}));

type Props = {
    logId: string | number;
};

export const UserHistoryLogDetails: FunctionComponent<Props> = ({ logId }) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const { data: log, isFetching: loading } = useGetLogDetails(
        logId,
        'userlogs',
    );
    return (
        <Container maxWidth={false} className={classes.root}>
            {loading && <LoadingSpinner />}
            {log && (
                <>
                    {log.past_value.length > 0 && log.new_value.length > 0 && (
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <UserLogCompare
                                    title={formatMessage(MESSAGES.before)}
                                    log={log.past_value}
                                    compareLog={log.new_value}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                {log.new_value[0].deleted_at && (
                                    <h4 className="margin-bottom">
                                        {formatMessage(MESSAGES.deleted_at)}
                                    </h4>
                                )}
                                <UserLogCompare
                                    title={formatMessage(MESSAGES.after)}
                                    log={log.new_value}
                                    compareLog={log.past_value}
                                />
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
                                    <UserLogCompare
                                        log={log.new_value}
                                        compareLog={log.past_value}
                                    />
                                </Grid>
                            </Grid>
                        )}
                </>
            )}
        </Container>
    );
};
