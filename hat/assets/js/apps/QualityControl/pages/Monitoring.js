import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';

import { createUrl } from '../../../utils/fetchData';
import LoadingSpinner from '../../../components/loading-spinner';
import PeriodSelectorComponent from '../../../components/PeriodSelectorComponent';
import TabsComponent from '../../../components/TabsComponent';
import CustomTableComponent from '../../../components/CustomTableComponent';
import screenersColumns from '../constants/screenersColumns';
import confirmersColumns from '../constants/confirmersColumns';
import screenersqaColumns from '../constants/screenersqaColumns';
import confirmersqaColumns from '../constants/confirmersqaColumns';
import screenerscentralqaColumns from '../constants/screenerscentralqaColumns';
import confirmerscentralqaColumns from '../constants/confirmerscentralqaColumns';
import { currentUserActions } from '../../../redux/currentUserReducer';

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

class Cases extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentTab: 'screener',
            screenersColumns: screenersColumns(props.intl.formatMessage),
            confirmersColumns: confirmersColumns(props.intl.formatMessage),
            screenersqaColumns: screenersqaColumns(props.intl.formatMessage),
            confirmersqaColumns: confirmersqaColumns(props.intl.formatMessage),
            screenerscentralqaColumns: screenerscentralqaColumns(props.intl.formatMessage),
            confirmerscentralqaColumns: confirmerscentralqaColumns(props.intl.formatMessage),
        };
    }
    componentWillMount() {
        this.props.fetchCurrentUserInfos();
    }
    getEndpointUrl(tabType, toExport = false, exportType = 'csv') {
        const type = tabType.startsWith('screener') ? 'screener' : 'confirmer'
        let url = `/api/teststats/?grouping=tester&testertype=${type}`;
        const {
            params,
        } = this.props;
        const urlParams = {
            from: params.date_from,
            to: params.date_to,
            order: type === 'screener' ? params.screenerOrder : params.confirmerOrder,
            level: (type.indexOf('central') !== -1) ? 'central' : 'coordination',
        };

        if (toExport) {
            urlParams[exportType] = true;
        }

        Object.keys(urlParams).forEach((key) => {
            const value = urlParams[key];
            if (value && !url.includes(key)) {
                url += `&${key}=${value}`;
            }
        });
        return url;
    }

    selectTester(testerItem, event) {
        const { params } = this.props;
        const newParams = {
            userId: testerItem.tester_id,
            date_from: params.date_from,
            date_to: params.date_to,
        };

        this.props.redirectTo('monitoring/detail', newParams);
    }

    render() {
        const {
            intl: {
                formatMessage,
            },
            params,
            currentUser,
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
                    this.props.load.loading && <LoadingSpinner message={formatMessage({
                        defaultMessage: 'Chargement en cours',
                        id: 'microplanning.labels.loading',
                    })}
                    />
                }

                <div className="widget__container ">
                    <div className="widget__header">
                        <h2 className="widget__heading"><FormattedMessage id="datas.monitoring.header.title" defaultMessage="Monitorage" /></h2>
                    </div>
                    <div className="widget__header widget__content--quarter">
                        <PeriodSelectorComponent
                            dateFrom={this.props.params.date_from}
                            dateTo={this.props.params.date_to}
                            onChangeDate={(dateFrom, dateTo) =>
                                this.props.redirectTo('monitoring', {
                                    ...this.props.params,
                                    date_from: dateFrom,
                                    date_to: dateTo,
                                })}
                        />
                    </div>
                </div>
                <TabsComponent
                    selectTab={key => (this.setState({ currentTab: key }))}
                    params={params}
                    defaultPath={baseUrl}
                    tabs={tabs}
                    defaultSelect={currentTab}
                />
                <div className={`widget__container no-border ${this.state.currentTab !== 'screener' ? 'hidden' : ''}`} >
                    <CustomTableComponent
                        showPagination={false}
                        endPointUrl={this.getEndpointUrl('screener')}
                        columns={this.state.screenersColumns}
                        defaultSorted={[{ id: 'tester__user__last_name', desc: false }]}
                        params={this.props.params}
                        defaultPath={baseUrl}
                        orderKey="screenerOrder"
                        multiSort
                        withBorder={false}
                        isSortable={false}
                        canSelect={false}
                        dataKey="result"
                    />
                </div>
                <div className={`widget__container no-border ${this.state.currentTab !== 'confirmer' ? 'hidden' : ''}`}>
                    <CustomTableComponent
                        showPagination={false}
                        endPointUrl={this.getEndpointUrl('confirmer')}
                        columns={this.state.confirmersColumns}
                        defaultSorted={[{ id: 'tester__user__last_name', desc: false }]}
                        params={this.props.params}
                        defaultPath={baseUrl}
                        orderKey="confirmerOrder"
                        multiSort
                        withBorder={false}
                        isSortable={false}
                        canSelect={false}
                        dataKey="result"
                    />
                </div>
                <div className={`widget__container no-border ${this.state.currentTab !== 'screenerqa' ? 'hidden' : ''}`} >
                    <CustomTableComponent
                        showPagination={false}
                        endPointUrl={this.getEndpointUrl('screenerqa')}
                        columns={this.state.screenersqaColumns}
                        defaultSorted={[{ id: 'tester__user__last_name', desc: false }]}
                        params={this.props.params}
                        defaultPath={baseUrl}
                        orderKey="screenerOrder"
                        multiSort
                        withBorder={false}
                        isSortable={false}
                        canSelect={false}
                        dataKey="result"
                    />
                </div>
                <div className={`widget__container no-border ${this.state.currentTab !== 'confirmerqa' ? 'hidden' : ''}`}>
                    <CustomTableComponent
                        showPagination={false}
                        endPointUrl={this.getEndpointUrl('confirmerqa')}
                        columns={this.state.confirmersqaColumns}
                        defaultSorted={[{ id: 'tester__user__last_name', desc: false }]}
                        params={this.props.params}
                        defaultPath={baseUrl}
                        orderKey="confirmerOrder"
                        multiSort
                        withBorder={false}
                        isSortable={false}
                        canSelect={false}
                        dataKey="result"
                    />
                </div>
                <div className={`widget__container no-border ${this.state.currentTab !== 'screenercentralqa' ? 'hidden' : ''}`} >
                    <CustomTableComponent
                        showPagination={false}
                        endPointUrl={this.getEndpointUrl('screenercentralqa')}
                        columns={this.state.screenerscentralqaColumns}
                        defaultSorted={[{ id: 'tester__user__last_name', desc: false }]}
                        params={this.props.params}
                        defaultPath={baseUrl}
                        orderKey="screenerOrder"
                        multiSort
                        withBorder={false}
                        isSortable={false}
                        canSelect={false}
                        dataKey="result"
                        onRowClicked={(item, state, event) => this.selectTester(item, event)}
                    />
                </div>
                <div className={`widget__container no-border ${this.state.currentTab !== 'confirmercentralqa' ? 'hidden' : ''}`}>
                    <CustomTableComponent
                        showPagination={false}
                        endPointUrl={this.getEndpointUrl('confirmercentralqa')}
                        columns={this.state.confirmerscentralqaColumns}
                        defaultSorted={[{ id: 'tester__user__last_name', desc: false }]}
                        params={this.props.params}
                        defaultPath={baseUrl}
                        orderKey="confirmerOrder"
                        multiSort
                        withBorder={false}
                        isSortable={false}
                        canSelect={false}
                        dataKey="result"
                    />
                </div>
            </section>
        );
    }
}

Cases.propTypes = {
    load: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    currentUser: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
    currentUser: state.currentUser.user,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    fetchCurrentUserInfos: () => dispatch(currentUserActions.fetchCurrentUserInfos(dispatch)),
});

const CasesWithIntl = injectIntl(Cases);

export default connect(MapStateToProps, MapDispatchToProps)(CasesWithIntl);
