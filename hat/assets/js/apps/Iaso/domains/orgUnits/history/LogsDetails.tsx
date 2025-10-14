import React, { FunctionComponent } from 'react';
import Alert from '@mui/lab/Alert';
import { Container, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    LoadingSpinner,
    LinkWithLocation,
    commonStyles,
    useSafeIntl,
} from 'bluesquare-components';
import { baseUrls } from 'Iaso/constants/urls';
import { useGetLogDetails } from 'Iaso/hooks/useGetLogDetails';
import LogCompareComponent from './LogCompareComponent';
import { MESSAGES } from './messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    root: {
        cursor: 'default',
        paddingBottom: theme.spacing(4),
        paddingTop: theme.spacing(4),
    },
    link: {
        textDecoration: 'underline',
        '&:hover': {
            textDecoration: 'none',
        },
    },
}));

type Props = {
    goToRevision: any;
    logId: string | number;
    showButtons?: boolean;
};

export const LogsDetails: FunctionComponent<Props> = ({
    goToRevision,
    logId,
    showButtons = false,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const { data: log, isFetching: loading } = useGetLogDetails(logId);
    return (
        <Container maxWidth={false} className={classes.root}>
            {loading && <LoadingSpinner />}
            {log && (
                <>
                    {log.org_unit_change_request_id && (
                        <Grid container spacing={2} mb={2}>
                            <Grid item xs={12}>
                                <Alert severity="info">
                                    <LinkWithLocation
                                        className={classes.link}
                                        target="_blank"
                                        to={`/${baseUrls.orgUnitsChangeRequestDetail}/changeRequestId/${log.org_unit_change_request_id}`}
                                    >
                                        {formatMessage(
                                            MESSAGES.goToChangeRequest,
                                            {
                                                change_request_id:
                                                    log.org_unit_change_request_id,
                                            },
                                        )}
                                    </LinkWithLocation>
                                </Alert>
                            </Grid>
                        </Grid>
                    )}
                    {log.past_value.length > 0 && log.new_value.length > 0 && (
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <LogCompareComponent
                                    title={formatMessage(MESSAGES.before)}
                                    log={log.past_value}
                                    compareLog={log.new_value}
                                    goToRevision={goToRevision}
                                    showButtons={showButtons}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <LogCompareComponent
                                    title={formatMessage(MESSAGES.after)}
                                    log={log.new_value}
                                    compareLog={log.past_value}
                                    goToRevision={goToRevision}
                                    isNewValue
                                    showButtons={showButtons}
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
