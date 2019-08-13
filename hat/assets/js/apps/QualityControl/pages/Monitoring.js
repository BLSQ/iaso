import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';

import { createUrl } from '../../../utils/fetchData';

import { loadActions } from '../../../redux/load';

import screenersColumns from '../constants/screenersColumns';
import confirmersColumns from '../constants/confirmersColumns';
import screenersqaColumns from '../constants/screenersqaColumns';
import confirmersqaColumns from '../constants/confirmersqaColumns';
import screenerscentralqaColumns from '../constants/screenerscentralqaColumns';
import confirmerscentralqaColumns from '../constants/confirmerscentralqaColumns';
import monitoringTabs from '../constants/monitoringTabs';
import { filtersValidators } from '../constants/filters';

import { currentUserActions } from '../../../redux/currentUserReducer';
import { monitoringActions } from '../redux/monitoring';

import LoadingSpinner from '../../../components/loading-spinner';
import PeriodSelectorComponent from '../../../components/PeriodSelectorComponent';
import TabsComponent from '../../../components/TabsComponent';
import CustomTableComponent from '../../../components/CustomTableComponent';
import FiltersComponent from '../../../components/FiltersComponent';

export const baseUrl = 'monitoring';

const MESSAGES = defineMessages({
    screener: {
        defaultMessage: 'Stats Dép.',
        id: 'management.monitoring.screener',
    },
    confirmer: {
        defaultMessage: 'Stats Conf.',
        id: 'management.monitoring.confirmer',
    },
    screenerqa: {
        defaultMessage: '🖼 Coordination',
        id: 'management.monitoring.screenerqa',
    },
    confirmerqa: {
        defaultMessage: '🎦 Coordination',
        id: 'management.monitoring.confirmerqa',
    },
    screenercentralqa: {
        defaultMessage: '🖼 Central',
        id: 'management.monitoring.screenercentralqa',
    },
    confirmercentralqa: {
        defaultMessage: '🎦 Central',
        id: 'management.monitoring.confirmercentralqa',
    },
});

class Monitoring extends Component {
    constructor(props) {
        super(props);
        const { intl: { formatMessage } } = props;
        const loadingTabs = {};
        monitoringTabs.forEach((tab) => {
            loadingTabs[tab.key] = false;
        });
        this.state = {
            currentTab: props.params.tab ? props.params.tab : 'screener',
            screenersColumns: screenersColumns(formatMessage),
            confirmersColumns: confirmersColumns(formatMessage),
            screenersqaColumns: screenersqaColumns(formatMessage),
            confirmersqaColumns: confirmersqaColumns(formatMessage),
            screenerscentralqaColumns: screenerscentralqaColumns(formatMessage),
            confirmerscentralqaColumns: confirmerscentralqaColumns(formatMessage),
            loadingTabs,
        };
    }

    componentWillMount() {
        this.props.fetchCurrentUserInfos();
        this.props.fetchValidators();
    }

    getEndpointUrl(tabType, toExport = false, exportType = 'csv') {
        const type = tabType.startsWith('screener') ? 'screener' : 'confirmer';
        let url = `/api/teststats/?grouping=tester&testertype=${type}`;
        const {
            params,
        } = this.props;
        const urlParams = {
            from: params.date_from,
            to: params.date_to,
            order: type === 'screener' ? params.screenerOrder : params.confirmerOrder,
            level: (type.indexOf('central') !== -1) ? 'central' : 'coordination',
            validator_id: params.validatorId,
        };

        if (toExport) {
            urlParams[exportType] = true;
            urlParams.currentStats = tabType;
        }

        Object.keys(urlParams).forEach((key) => {
            const value = urlParams[key];
            if (value && !url.includes(key)) {
                url += `&${key}=${value}`;
            }
        });
        return url;
    }

    selectTester(testerItem) {
        const { params } = this.props;
        const newParams = {
            userId: testerItem.tester_id,
            ...params,
        };
        delete newParams.back;

        this.props.redirectTo('monitoring/detail', newParams);
    }

    toggleLoadingTab(key, value) {
        const newState = {
            ...this.state,
        };
        newState.loadingTabs[key] = value;
        this.setState(newState);
        if (value && !this.props.load.loading) {
            this.props.startLoading();
        } else if (!newState.loadingTabs[newState.currentTab] && this.props.load.loading) {
            this.props.endLoading();
        }
    }

    render() {
        const {
            intl: {
                formatMessage,
            },
            params,
            currentUser,
            setTable,
            profiles,
        } = this.props;

        const { currentTab } = this.state;
        let tabs = [
            { label: formatMessage(MESSAGES.screener), key: 'screener' },
            { label: formatMessage(MESSAGES.confirmer), key: 'confirmer' },
        ];

        if (currentUser) {
            if (currentUser.level >= 20 && currentUser.level < 30) {
                tabs = tabs.concat([
                    { label: formatMessage(MESSAGES.screenerqa), key: 'screenerqa' },
                    { label: formatMessage(MESSAGES.confirmerqa), key: 'confirmerqa' },
                ]);
            }
            if (currentUser.level >= 30) {
                tabs = tabs.concat([
                    { label: formatMessage(MESSAGES.screenercentralqa), key: 'screenercentralqa' },
                    { label: formatMessage(MESSAGES.confirmercentralqa), key: 'confirmercentralqa' },
                ]);
            }
        }
        return (
            <section className="cases-list-container">
                {
                    this.props.load.loading && (
                        <LoadingSpinner message={formatMessage({
                            defaultMessage: 'Chargement en cours',
                            id: 'microplanning.labels.loading',
                        })}
                        />
                    )
                }

                <div className="widget__container ">
                    <div className="widget__header">
                        <h2 className="widget__heading"><FormattedMessage id="datas.monitoring.header.title" defaultMessage="Monitorage" /></h2>
                    </div>
                    <div className="widget__header widget__content--quarter">
                        <PeriodSelectorComponent
                            dateFrom={params.date_from}
                            dateTo={params.date_to}
                            onChangeDate={(dateFrom, dateTo) => this.props.redirectTo('monitoring', {
                                ...params,
                                date_from: dateFrom,
                                date_to: dateTo,
                            })}
                        />
                    </div>
                </div>
                {
                    profiles.length > 0
                    && (
                        <div className="widget__container ">
                            <div className="widget__content--tier">
                                <div>
                                    <FiltersComponent
                                        params={params}
                                        baseUrl={baseUrl}
                                        filters={filtersValidators(profiles, {
                                            id: 'quality.label.validator',
                                            defaultMessage: 'Validateur',
                                        })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                <TabsComponent
                    selectTab={key => (this.setState({ currentTab: key }))}
                    params={params}
                    defaultPath={baseUrl}
                    tabs={tabs}
                    defaultSelect={currentTab}
                />
                {
                    monitoringTabs.map(tab => (
                        <div
                            key={tab.key}
                            className={`widget__container no-margin no-border ${this.state.currentTab !== tab.key ? 'hidden' : ''}`}
                        >
                            <CustomTableComponent
                                showPagination={false}
                                endPointUrl={this.getEndpointUrl(tab.key)}
                                columns={this.state[tab.columns]}
                                defaultSorted={[{ id: 'tester__user__last_name', desc: false }]}
                                params={params}
                                defaultPath={baseUrl}
                                orderKey={tab.orderKey}
                                multiSort
                                withBorder={false}
                                isSortable={false}
                                canSelect={tab.selectable}
                                dataKey="result"
                                onRowClicked={item => (tab.selectable ? this.selectTester(item) : null)}
                                onDataStartLoaded={() => this.toggleLoadingTab(tab.key, true)}
                                onDataLoaded={(list, count, pages) => {
                                    this.toggleLoadingTab(tab.key, false);
                                    setTable(tab.key, list, false, params, count, pages);
                                }}
                                reduxPage={this.props[`${tab.key}Data`]}
                                displayLoader={false}
                            />
                            <div className="align-right padding">
                                <button
                                    className="button"
                                    onClick={() => {
                                        window.location.href = this.getEndpointUrl(tab.key, true, 'xlsx');
                                    }}
                                >
                                    <i className="fa fa-file-excel-o" />
                                    XLSX
                                </button>
                            </div>
                        </div>
                    ))
                }
            </section>
        );
    }
}

const propTypes = {};
monitoringTabs.forEach((tab) => {
    propTypes[`${tab.key}Data`] = PropTypes.object.isRequired;
});

Monitoring.propTypes = {
    ...propTypes,
    load: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    currentUser: PropTypes.object.isRequired,
    fetchCurrentUserInfos: PropTypes.func.isRequired,
    setTable: PropTypes.func.isRequired,
    profiles: PropTypes.array.isRequired,
    fetchValidators: PropTypes.func.isRequired,
    startLoading: PropTypes.func.isRequired,
    endLoading: PropTypes.func.isRequired,
};

const MapStateToProps = (state) => {
    const newState = {};
    monitoringTabs.forEach((tab) => {
        newState[`${tab.key}Data`] = state.monitoring.tables[tab.key];
    });
    return ({
        ...newState,
        load: state.load,
        profiles: state.monitoring.profiles,
        currentUser: state.currentUser.user,
    });
};

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    fetchCurrentUserInfos: () => dispatch(currentUserActions.fetchCurrentUserInfos(dispatch)),
    fetchValidators: () => dispatch(monitoringActions.fetchValidators(dispatch)),
    startLoading: () => dispatch(loadActions.startLoading()),
    endLoading: () => dispatch(loadActions.successLoadingNoData()),
    setTable: (key, list, showPagination, params, count, pages) => dispatch(monitoringActions.setTable(key, list, showPagination, params, count, pages)),
});

const MonitoringWithIntl = injectIntl(Monitoring);

export default connect(MapStateToProps, MapDispatchToProps)(MonitoringWithIntl);
