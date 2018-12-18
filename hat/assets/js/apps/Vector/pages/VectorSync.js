import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import LoadingSpinner from '../../../components/loading-spinner';
import CustomTableComponent from '../../../components/CustomTableComponent';
import sitesColumns from '../utlls/sitesColumns';
import { MESSAGES } from '../utlls/vectorMapUtils';
import targetsColumns from '../utlls/targetsColumns';
import TabsComponent from '../../../components/TabsComponent';


const baseUrl = 'sync';
class VectorSync extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sitesColumns: sitesColumns(props.intl.formatMessage, MESSAGES),
            targetsColumns: targetsColumns(props.intl.formatMessage),
            currentTab: 'sites',
        };
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
        } = this.props;

        const {
            currentTab,
        } = this.state;
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
                            endPointUrl="/api/sites?by_sync=True"
                            columns={this.state.sitesColumns}
                            defaultSorted={[{ id: 'created_at', desc: false }]}
                            params={params}
                            onRowClicked={() => { }}
                            multiSort
                            pageSize={50}
                            dataKey="list"
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
                            endPointUrl="/api/targets?by_sync=True"
                            columns={this.state.targetsColumns}
                            defaultSorted={[{ id: 'date_time', desc: false }]}
                            params={params}
                            onRowClicked={() => { }}
                            multiSort
                            pageSize={50}
                            dataKey="list"
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
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
};

const VectorSyncIntl = injectIntl(VectorSync);

const MapStateToProps = state => ({
    load: state.load,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
});

export default connect(MapStateToProps, MapDispatchToProps)(VectorSyncIntl);
