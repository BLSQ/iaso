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

export const baseUrl = 'monitoring';

const MESSAGES = defineMessages({
    screener: {
        defaultMessage: 'Dépisteur',
        id: 'management.monitoring.screener',
    },
    confirmer: {
        defaultMessage: 'Confirmateur',
        id: 'management.monitoring.confirmer',
    },
});

class Cases extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentTab: 'screener',
            screenersColumns: screenersColumns(props.intl.formatMessage),
            confirmersColumns: confirmersColumns(props.intl.formatMessage),
        };
    }

    getEndpointUrl(type, toExport = false, exportType = 'csv') {
        let url = `/api/teststats/?grouping=tester&testertype=${type}`;
        const {
            params,
        } = this.props;
        const urlParams = {
            from: params.date_from,
            to: params.date_to,
            order: type === 'screener' ? params.screenerOrder : params.confirmerOrder,
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

    render() {
        const {
            intl: {
                formatMessage,
            },
            params,
        } = this.props;

        const { currentTab } = this.state;
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
                    tabs={[
                        { label: formatMessage(MESSAGES.screener), key: 'screener' },
                        { label: formatMessage(MESSAGES.confirmer), key: 'confirmer' },
                    ]}
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
                        isSortable
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
                        isSortable
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
};

const MapStateToProps = state => ({
    load: state.load,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

const CasesWithIntl = injectIntl(Cases);

export default connect(MapStateToProps, MapDispatchToProps)(CasesWithIntl);
