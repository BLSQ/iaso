import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import moment from 'moment';

import Grid from '@material-ui/core/Grid';

import PropTypes from 'prop-types';

import { createUrl } from '../../../utils/fetchData';
import { logsActions } from '../redux/logs';
import { loadActions } from '../../../redux/load';

import LoadingSpinner from '../../../components/loading-spinner';
import LogCompareComponent from '../components/LogCompareComponent';

import { getRequest } from '../../Iaso/libs/Api';

class LogsDetails extends Component {
    componentWillMount() {
        this.fetchDetail();
    }

    fetchDetail() {
        const { params, dispatch } = this.props;
        dispatch(loadActions.startLoading());
        getRequest(`/api/logs/${params.log_id}`)
            .then((logDetail) => {
                dispatch(loadActions.successLoadingNoData());
                this.props.loadDetail(logDetail);
            })
            .catch((err) => {
                dispatch(loadActions.errorLoading(err));
                console.error(`Error while fetching test detail ${err}`);
            });
    }

    goBack() {
        const { redirectTo, params } = this.props;
        const tempParams = {
            ...params,
        };
        delete tempParams.log_id;
        tempParams.back = true;
        this.props.loadDetail(null);
        redirectTo('logs', tempParams);
    }

    render() {
        const { log, load, intl: { formatMessage } } = this.props;
        const isDuplicateLog = log && log.past_value[0] && log.past_value[0].model === 'patient.patientduplicatespair';
        return (
            <section className="logs-details-container">
                {
                    load.loading && (
                        <LoadingSpinner message={formatMessage({
                            defaultMessage: 'Loading',
                            id: 'main.label.loading',
                        })}
                        />
                    )
                }

                <div className="widget__container ">
                    <div className="widget__header">
                        <button
                            className="button--back"
                            onClick={() => this.goBack()}
                        >
                            <i className="fa fa-arrow-left" />
                            {' '}
                        </button>
                        <h2 className="widget__heading"><FormattedMessage id="logs.title" defaultMessage="Log" /></h2>
                    </div>
                    {
                        log && (
                            <div className="widget__content">
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
                            </div>
                        )
                    }
                </div>
            </section>
        );
    }
}

LogsDetails.defaultProps = {
    log: null,
};

LogsDetails.propTypes = {
    load: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    log: PropTypes.object,
    loadDetail: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
    log: state.logs.detail,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    loadDetail: detail => dispatch(logsActions.loadLogDetail(detail)),
});

const LogsDetailsWithIntl = injectIntl(LogsDetails);

export default connect(MapStateToProps, MapDispatchToProps)(LogsDetailsWithIntl);
