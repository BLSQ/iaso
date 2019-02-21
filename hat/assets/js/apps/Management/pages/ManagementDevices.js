import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import moment from 'moment';
import {
    FormattedMessage,
    injectIntl,
    defineMessages,
} from 'react-intl';

import CustomTableComponent from '../../../components/CustomTableComponent';
import LoadingSpinner from '../../../components/loading-spinner';
import { createUrl } from '../../../utils/fetchData';
import { detailsActions } from '../redux/details';
import FiltersComponent from '../../../components/FiltersComponent';
import { withTestDevices } from '../../../utils/constants/filters';
import managementDevicesColumns from '../constants/managementDevicesColumns';
import { devicesActions } from '../redux/devices';


const MESSAGES = defineMessages({
    'location-all': {
        defaultMessage: 'All',
        id: 'teamsdevices.labels.all',
    },
    loading: {
        defaultMessage: 'Chargement en cours',
        id: 'teamsdevices.labels.loading',
    },
});


export class ManagementDevices extends Component {
    constructor(props) {
        super(props);
        const { formatMessage } = props.intl;
        this.state = {
            tableColumns: managementDevicesColumns(formatMessage, this),
        };
    }

    getEndpointUrl() {
        let url = '/api/devices/?';
        if (this.props.params.with_tests_devices) {
            url += 'with_tests_devices=True';
        }
        return url;
    }

    selectDevice(deviceItem) {
        const { dispatch } = this.props;
        const from = moment().startOf('year').format('YYYY-MM-DD');
        const to = moment().format('YYYY-MM-DD');
        dispatch(detailsActions.loadCurrentDetail(deviceItem));
        const { order } = this.props.params;
        const tempParams = this.props.params;
        delete tempParams.order;
        this.props.redirectTo('detail', {
            deviceId: deviceItem.id,
            ...tempParams,
            deviceOrder: order,
            from,
            to,
        });
    }

    render() {
        const {
            intl: {
                formatMessage,
            },
            load: {
                loading, error,
            },
            params,
            setDevicesList,
            reduxPage,
        } = this.props;
        return (
            <div>
                {
                    error &&
                    <div className="widget__container">
                        <div className="widget__header">
                            <h2 className="widget__heading text--error"><FormattedMessage id="teamsdevices.header.error" defaultMessage="Error:" /></h2>
                        </div>
                        <div className="widget__content">
                            {error}
                        </div>
                    </div>
                }
                {
                    loading && <LoadingSpinner message={formatMessage(MESSAGES.loading)} />
                }

                <div className="widget__container" data-qa="monthly-report-data-loaded">
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <FormattedMessage id="teamsdevices.header.results" defaultMessage="Synchronisation des Appareils" />
                            <div className="float-right">
                                <FiltersComponent
                                    params={this.props.params}
                                    baseUrl="devices"
                                    filters={[
                                        withTestDevices(),
                                    ]}
                                />
                            </div>
                        </h2>
                    </div>
                    <CustomTableComponent
                        selectable
                        isSortable
                        showPagination={false}
                        endPointUrl={this.getEndpointUrl()}
                        columns={this.state.tableColumns}
                        defaultSorted={[{ id: 'last_synced_date', desc: false }]}
                        params={this.props.params}
                        defaultPath="devices"
                        canSelect={false}
                        onDataLoaded={(newDevicesList, count, pages) => setDevicesList(newDevicesList, false, params, count, pages)}
                        multiSort
                        reduxPage={reduxPage}
                    />
                </div>
            </div>
        );
    }
}

const ManagementDevicesWithIntl = injectIntl(ManagementDevices);


ManagementDevices.defaultProps = {
    reduxPage: undefined,
};

ManagementDevices.propTypes = {
    params: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    reduxPage: PropTypes.object,
    setDevicesList: PropTypes.func.isRequired,
};
const MapStateToProps = state => ({
    config: state.config,
    load: state.load,
    reduxPage: state.devices.devicesPage,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setDevicesList: (devicesList, showPagination, params, count, pages) => dispatch(devicesActions.setDevicesList(devicesList, showPagination, params, count, pages)),
});


export default connect(MapStateToProps, MapDispatchToProps)(ManagementDevicesWithIntl);
