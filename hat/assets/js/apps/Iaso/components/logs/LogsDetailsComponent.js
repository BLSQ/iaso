import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import { Container, Grid } from '@mui/material';
import { withStyles } from '@mui/styles';

import PropTypes from 'prop-types';

import {
    injectIntl,
    commonStyles,
    LoadingSpinner,
} from 'bluesquare-components';

import LogCompareComponent from './LogCompareComponent';

import { fetchLogDetail } from '../../utils/requests';

import MESSAGES from './messages';

const styles = theme => ({
    ...commonStyles(theme),
    root: {
        cursor: 'default',
        paddingBottom: theme.spacing(4),
        paddingTop: theme.spacing(4),
    },
});

class LogsDetails extends Component {
    constructor(props) {
        super(props);
        this.state = {
            log: undefined,
            loading: false,
        };
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {
        this.fetchDetail();
    }

    fetchDetail() {
        const { dispatch, logId } = this.props;
        this.setState({
            loading: true,
        });
        fetchLogDetail(dispatch, logId)
            .then(logDetail => {
                this.setState({
                    log: logDetail,
                    loading: false,
                });
            })
            .catch(() => {
                this.setState({
                    loading: false,
                });
            });
    }

    render() {
        const {
            intl: { formatMessage },
            classes,
            goToRevision,
        } = this.props;
        const { log, loading } = this.state;
        return (
            <Container maxWidth={false} className={classes.root}>
                {loading && (
                    <LoadingSpinner message={formatMessage(MESSAGES.loading)} />
                )}
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
                                    />
                                </Grid>
                            </Grid>
                        )}
                        {log.past_value.length > 0 &&
                            log.new_value.length === 0 && (
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <h4 className="margin-bottom">
                                            <FormattedMessage
                                                {...MESSAGES.deleted}
                                            />
                                        </h4>
                                        <LogCompareComponent
                                            log={log.past_value}
                                        />
                                    </Grid>
                                </Grid>
                            )}
                        {log.past_value.length === 0 &&
                            log.new_value.length > 0 && (
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <h4 className="margin-bottom">
                                            <FormattedMessage
                                                {...MESSAGES.created}
                                            />
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
    }
}

LogsDetails.propTypes = {
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    logId: PropTypes.number.isRequired,
    goToRevision: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
});

const LogsDetailsWithIntl = injectIntl(LogsDetails);

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(LogsDetailsWithIntl),
);
