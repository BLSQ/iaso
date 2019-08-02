import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { FormattedMessage, injectIntl } from 'react-intl';

import PropTypes from 'prop-types';

import { createUrl } from '../../../utils/fetchData';

import CustomTableComponent from '../../../components/CustomTableComponent';
import FiltersComponent from '../../../components/FiltersComponent';
import SearchButton from '../../../components/SearchButton';
import LoadingSpinner from '../../../components/loading-spinner';
import ChoosePeriodSelectorComponent from '../../../components/ChoosePeriodSelectorComponent';

import managementLogsColumns from '../constants/managementLogsColumns';

import { logsActions } from '../redux/logs';
import { filterActions } from '../../../redux/filtersRedux';

import { users } from '../../../utils/constants/filters';

const baseUrl = 'logs';

class Logs extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: managementLogsColumns(props.intl.formatMessage),
            tableUrl: null,
        };
    }

    componentWillMount() {
        const {
            params,
            redirectTo,
        } = this.props;
        if (params.back) {
            delete params.back;
            this.onSearch();
            redirectTo(baseUrl, params);
        }

        this.props.fetchProfiles();
    }

    onSearch() {
        this.setState({
            tableUrl: this.getEndpointUrl(),
        });
    }

    getEndpointUrl() {
        let url = '/api/logs/?';
        const {
            params,
        } = this.props;
        const urlParams = {
            ...params,
            from: params.date_from,
            to: params.date_to,
        };

        Object.keys(urlParams).forEach((key) => {
            const value = urlParams[key];
            if (value && !url.includes(key)) {
                url += `&${key}=${value}`;
            }
        });
        return url;
    }

    selectLog(log) {
        const { params, redirectTo } = this.props;
        const newParams = {
            log_id: log.id,
            ...params,
        };
        redirectTo('logs/detail', newParams);
    }

    render() {
        const {
            intl: { formatMessage },
            load,
            params,
            redirectTo,
            setLogsList,
            reduxPage,
            profiles,
        } = this.props;
        const { tableUrl, tableColumns } = this.state;
        return (
            <section className="logs-list-container">
                {
                    load.loading && (
                        <LoadingSpinner message={formatMessage({
                            defaultMessage: 'Chargement en cours',
                            id: 'microplanning.labels.loading',
                        })}
                        />
                    )
                }

                <div className="widget__container ">
                    <div className="widget__header">
                        <h2 className="widget__heading"><FormattedMessage id="management.logs.header.title" defaultMessage="Modifications" /></h2>
                    </div>
                    <div className="border-bottom">
                        <ChoosePeriodSelectorComponent
                            params={params}
                            baseUrl={baseUrl}
                            redirectTo={redirectTo}
                            showApplybutton={false}
                        />
                    </div>
                    <div className="widget__content--quarter">
                        <div>
                            <FiltersComponent
                                params={params}
                                baseUrl={baseUrl}
                                filters={[users(profiles)]}
                            />
                        </div>
                    </div>
                    <SearchButton onSearch={() => this.onSearch()} />
                </div>
                {
                    tableUrl
                    && (
                        <div className="widget__container  no-border">
                            <CustomTableComponent
                                isSortable
                                showPagination
                                endPointUrl={tableUrl}
                                columns={tableColumns}
                                defaultSorted={[{ id: 'created_at', desc: true }]}
                                params={params}
                                defaultPath={baseUrl}
                                dataKey="list"
                                onDataLoaded={(newLogsList, count, pages) => setLogsList(newLogsList, true, params, count, pages)}
                                multiSort
                                onRowClicked={log => this.selectLog(log)}
                                reduxPage={reduxPage}
                            />
                        </div>
                    )
                }
            </section>
        );
    }
}

Logs.defaultProps = {
    reduxPage: undefined,
};

Logs.propTypes = {
    load: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    setLogsList: PropTypes.func.isRequired,
    reduxPage: PropTypes.object,
    fetchProfiles: PropTypes.func.isRequired,
    profiles: PropTypes.array.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
    reduxPage: state.logs.reduxPage,
    profiles: state.geoFilters.profiles,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setLogsList: (logsList, showPagination, params, count, pages) => dispatch(logsActions.setLogsList(logsList, showPagination, params, count, pages)),
    fetchProfiles: () => dispatch(filterActions.fetchProfiles(dispatch, null, false, 'all')),
});

const LogsWithIntl = injectIntl(Logs);

export default connect(MapStateToProps, MapDispatchToProps)(LogsWithIntl);
