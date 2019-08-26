import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import moment from 'moment';

import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core';
import Container from '@material-ui/core/Container';

import PropTypes from 'prop-types';

import LoadingSpinner from '../LoadingSpinnerComponent';
import LogCompareComponent from '../../../Management/components/LogCompareComponent';
import commonStyles from '../../styles/common';

import {
    fetchLogDetail,
} from '../../utils/requests';


const styles = theme => ({
    ...commonStyles(theme),
    container: {
        ...commonStyles(theme).container,
        marginTop: theme.spacing(4),
        marginBottom: theme.spacing(4),
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

    componentWillMount() {
        this.fetchDetail();
    }

    fetchDetail() {
        const { dispatch, logId } = this.props;
        this.setState({
            loading: true,
        });
        fetchLogDetail(dispatch, logId)
            .then((logDetail) => {
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
            intl: { formatMessage }, classes,
        } = this.props;
        const { log, loading } = this.state;
        const isDuplicateLog = log && log.past_value[0] && log.past_value[0].model === 'patient.patientduplicatespair';
        return (
            <Container maxWidth={false} className={classes.container}>
                {
                    loading && (
                        <LoadingSpinner message={formatMessage({
                            defaultMessage: 'Loading',
                            id: 'main.label.loading',
                        })}
                        />
                    )
                }

                {
                    log && (
                        <Fragment>
                            <Grid container spacing={0}>
                                <Grid item xs={6}>
                                    <table className="margin-bottom">
                                        <tbody>
                                            <tr>
                                                <th>
                                                    <FormattedMessage
                                                        id="main.label.date"
                                                        defaultMessage="Date"
                                                    />
                                                </th>
                                                <td>{moment(log.created_at).format('YYYY-MM-DD HH:mm')}</td>
                                            </tr>
                                            <tr>
                                                <th>
                                                    <FormattedMessage
                                                        id="main.label.user"
                                                        defaultMessage="User"
                                                    />
                                                </th>
                                                <td>
                                                    {log.user.userName}
                                                    {
                                                        (log.user.firstName || log.user.lastName) && (
                                                            ` - ${log.user.firstName ? `${log.user.firstName} ` : ''}${log.user.lastName}`
                                                        )
                                                    }
                                                </td>
                                            </tr>
                                            <tr>
                                                <th>
                                                    <FormattedMessage
                                                        id="main.label.type"
                                                        defaultMessage="Type"
                                                    />
                                                </th>
                                                <td>{log.content_type}</td>
                                            </tr>
                                            <tr>
                                                <th>
                                                    <FormattedMessage
                                                        id="main.label.source"
                                                        defaultMessage="source"
                                                    />
                                                </th>
                                                <td>{log.source}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </Grid>
                            </Grid>
                            {
                                log.past_value.length > 0
                                && log.new_value.length > 0
                                && (
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <h4 className="margin-bottom">
                                                {
                                                    !isDuplicateLog && (
                                                        <FormattedMessage
                                                            id="main.label.before"
                                                            defaultMessage="Before"
                                                        />
                                                    )
                                                }
                                                {
                                                    isDuplicateLog && (
                                                        <FormattedMessage
                                                            id="logs.label.duplicate_erased"
                                                            defaultMessage="Duplicate erased"
                                                        />
                                                    )
                                                }
                                            </h4>
                                            {<LogCompareComponent log={log.past_value} compareLog={log.new_value} />}
                                        </Grid>
                                        <Grid item xs={6}>
                                            <h4 className="margin-bottom">
                                                {
                                                    !isDuplicateLog && (
                                                        <FormattedMessage
                                                            id="main.label.after"
                                                            defaultMessage="After"
                                                        />
                                                    )
                                                }
                                                {
                                                    isDuplicateLog && (
                                                        <FormattedMessage
                                                            id="logs.label.patient_saved"
                                                            defaultMessage="Saved patient"
                                                        />
                                                    )
                                                }
                                            </h4>
                                            {<LogCompareComponent log={log.new_value} compareLog={log.past_value} />}
                                        </Grid>
                                    </Grid>
                                )
                            }
                            {
                                log.past_value.length > 0
                                && log.new_value.length === 0
                                && (
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <h4 className="margin-bottom">
                                                <FormattedMessage
                                                    id="logs.label.delete"
                                                    defaultMessage="Delted"
                                                />
                                            </h4>
                                            {<LogCompareComponent log={log.past_value} />}
                                        </Grid>
                                    </Grid>
                                )
                            }
                            {
                                log.past_value.length === 0
                                && log.new_value.length > 0
                                && (
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <h4 className="margin-bottom">
                                                <FormattedMessage
                                                    id="logs.label.create"
                                                    defaultMessage="Creation"
                                                />
                                            </h4>
                                            {<LogCompareComponent log={log.new_value} />}
                                        </Grid>
                                    </Grid>
                                )
                            }
                        </Fragment>
                    )
                }
            </Container>
        );
    }
}

LogsDetails.propTypes = {
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    logId: PropTypes.number.isRequired,
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
