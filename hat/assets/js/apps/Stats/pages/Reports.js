
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import {
    FormattedMessage,
    injectIntl,
    defineMessages,
} from 'react-intl';

import MGStyles from 'metrics-graphics/dist/metricsgraphics.css'; // eslint-disable-line no-unused-vars
import LoadingSpinner from '../../../components/loading-spinner';
import { createUrl } from '../../../utils/fetchData';
import { filterActions } from '../../../redux/filtersRedux';
import FiltersComponent from '../../../components/FiltersComponent';
import PeriodSelectorComponent from '../../../components/PeriodSelectorComponent';
import { teams, users } from '../../../utils/constants/filters';

const baseUrl = 'reports';

const MESSAGES = defineMessages({
    'location-all': {
        defaultMessage: 'All',
        id: 'Report.labels.all',
    },
    loading: {
        defaultMessage: 'Loading',
        id: 'Report.labels.loading',
    },
});

export class Report extends Component {
    componentDidMount() {
        this.props.fetchTeams();
        this.props.fetchProfiles(this.props.params.team_id);
    }

    componentWillReceiveProps(newProps) {
        if (newProps.params.team_id !== this.props.params.team_id) {
            this.props.fetchProfiles(newProps.params.team_id);
            const newParams = {
                ...newProps.params,
            };
            if (newParams.user_id) {
                delete newParams.user_id;
            }
            this.props.redirectTo(baseUrl, newParams);
        }
    }

    getEndpointUrl() {
        const {
            date_from, date_to, team_id, user_id,
        } = this.props.params;
        let url = `/api/teststats/?&grouping=village&from=${date_from}&to=${date_to}&xlsx=true`;
        if (team_id) {
            url += `&team_id=${team_id}`;
        }
        if (user_id) {
            url += `&user_id=${user_id}`;
        }
        return url;
    }

    downloadAction() {
        window.location.href = this.getEndpointUrl();
    }

    render() {
        const { formatMessage } = this.props.intl;
        const { date_from, date_to, team_id } = this.props.params;
        const { loading } = this.props.load;
        const { filters } = this.props;
        return (
            <div>
                <div className="widget__container">
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <FormattedMessage
                                id="report.title"
                                defaultMessage="Rapport"
                            />
                        </h2>
                    </div>
                </div>
                <div className="widget__container">
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <PeriodSelectorComponent
                                dateFrom={date_from}
                                dateTo={date_to}
                                showApplybutton={false}
                                onChangeDate={(dateFrom, dateTo) =>
                                    this.props.redirectTo(baseUrl, {
                                        ...this.props.params,
                                        date_from: dateFrom,
                                        date_to: dateTo,
                                    })}
                            />
                        </h2>
                    </div>
                </div>
                <div className="widget__container widget__content--tier">
                    <div>
                        <FiltersComponent
                            params={this.props.params}
                            baseUrl={baseUrl}
                            filters={[
                                teams(
                                    filters.teams,
                                    false,
                                ),
                            ]}
                        />
                    </div>
                    {
                        team_id &&
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl={baseUrl}
                                filters={[
                                    users(filters.profiles, {
                                        id: 'main.label.user',
                                        defaultMessage: 'Utilisateurs',
                                    }, false, 'user_id'),
                                ]}
                            />
                        </div>
                    }
                    {
                        team_id &&
                        <div>
                            <button
                                className="button margin-top"
                                onClick={() => this.downloadAction()}
                            >
                                <i className="fa fa-file-excel-o" />
                                XLSX
                            </button>
                        </div>
                    }
                </div>

                {
                    loading && <LoadingSpinner message={formatMessage(MESSAGES.loading)} />
                }
            </div>
        );
    }
}

Report.propTypes = {
    filters: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    fetchTeams: PropTypes.func.isRequired,
    fetchProfiles: PropTypes.func.isRequired,
    redirectTo: PropTypes.func.isRequired,
};

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    fetchTeams: () => dispatch(filterActions.fetchTeams(dispatch)),
    fetchProfiles: teamId => dispatch(filterActions.fetchProfiles(dispatch, teamId)),
});

const MapStateToProps = state => ({
    filters: state.filters,
    load: state.load,
});

const MonthlyReportWithIntl = injectIntl(Report);

export default connect(MapStateToProps, MapDispatchToProps)(MonthlyReportWithIntl);

