import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import { push } from 'react-router-redux';

import LoadingSpinner from '../../../components/loading-spinner';
import CustomTableComponent from '../../../components/CustomTableComponent';
import apiImportsColumns from '../utlls/apiImportsColumns';
import gpsImportsColumns from '../utlls/gpsImportsColumns';
import { MESSAGES } from '../utlls/vectorMapUtils';
import TabsComponent from '../../../components/TabsComponent';
import PeriodSelectorComponent from '../../../components/PeriodSelectorComponent';
import { fetchProfiles } from '../utlls/requests';
import { createUrl } from '../../../utils/fetchData';
import FiltersComponent from '../../../components/FiltersComponent';
import { filtersVectorsSync } from '../constants/vectorFilters';

const baseUrl = 'sync';
class VectorSync extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            apiImportsColumns: apiImportsColumns(props.intl.formatMessage),
            gpsImportsColumns: gpsImportsColumns(props.intl.formatMessage),
            currentTab: 'sites',
        };
    }
    componentWillMount() {
        const { dispatch } = this.props;
        fetchProfiles(dispatch);
    }

    render() {
        const {
            intl: {
                formatMessage,
            },
            load: {
                loading,
            },
            params,
            redirectTo,
            profiles,
        } = this.props;

        const {
            currentTab,
        } = this.state;
        const filters = filtersVectorsSync(profiles);
        return (
            <section>
                {
                    loading &&
                    <LoadingSpinner message={formatMessage({
                        defaultMessage: 'Chargement en cours',
                        id: 'microplanning.labels.loading',
                    })}
                    />
                }
                <div className="widget__container">
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <FormattedMessage id="VectorSync.title" defaultMessage="Synchronisation des données" />
                        </h2>
                    </div>
                    <div className="widget__content display-flex ">
                        <div>
                            <div className="filter-item-subtitle ">
                                <FormattedMessage id="VectorSync.period.title" defaultMessage="Période" />
                            </div>
                            <PeriodSelectorComponent
                                dateFrom={params.dateFrom}
                                dateTo={params.dateTo}
                                onChangeDate={(dateFrom, dateTo) =>
                                    redirectTo(baseUrl, {
                                        ...params,
                                        dateFrom,
                                        dateTo,
                                    })}
                            />
                        </div>
                        <div className="filter-inline">
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl={baseUrl}
                                filters={filters}
                            />
                        </div>
                    </div>
                </div>
                <TabsComponent
                    defaultPath={baseUrl}
                    params={params}
                    selectTab={key => (this.setState({ currentTab: key }))}
                    tabs={[
                        { label: formatMessage(MESSAGES.sites), key: 'sites' },
                        { label: formatMessage(MESSAGES.targets), key: 'targets' },
                    ]}
                    defaultSelect={currentTab}
                />
                <div className={`widget__container ${currentTab === 'sites' ? '' : 'hidden'}`}>
                    <div className="widget__content">
                        <CustomTableComponent
                            isSortable
                            showPagination
                            endPointUrl={`/api/vectorapiimports/?from=${params.dateFrom}&to=${params.dateTo}${params.userId ? `&userId=${params.userId}` : ''}`}
                            columns={this.state.apiImportsColumns}
                            defaultSorted={[{ id: 'created_at', desc: true }]}
                            params={params}
                            onRowClicked={() => { }}
                            multiSort
                            pageSize={50}
                            dataKey="imports"
                            pageKey="sitesPage"
                            pageSizeKey="sitesPageSize"
                            defaultPath={baseUrl}
                            orderKey="orderSites"
                            canSelect={false}
                        />
                    </div>
                </div>
                <div className={`widget__container ${currentTab === 'targets' ? '' : 'hidden'}`}>
                    <div className="widget__content">
                        <CustomTableComponent
                            isSortable
                            showPagination
                            endPointUrl={`/api/vectorgpsimports/?from=${params.dateFrom}&to=${params.dateTo}${params.userId ? `&userId=${params.userId}` : ''}`}
                            columns={this.state.gpsImportsColumns}
                            defaultSorted={[{ id: 'created_at', desc: true }]}
                            params={params}
                            onRowClicked={() => { }}
                            multiSort
                            pageSize={50}
                            dataKey="imports"
                            pageKey="targetsPage"
                            pageSizeKey="targetsPageSize"
                            defaultPath={baseUrl}
                            orderKey="orderTargets"
                            canSelect={false}
                        />
                    </div>
                </div>
            </section>);
    }
}

VectorSync.defaultProps = {
};

VectorSync.propTypes = {
    dispatch: PropTypes.func.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    profiles: PropTypes.array.isRequired,
};

const VectorSyncIntl = injectIntl(VectorSync);

const MapStateToProps = state => ({
    load: state.load,
    profiles: state.vectors.profiles,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

export default connect(MapStateToProps, MapDispatchToProps)(VectorSyncIntl);
