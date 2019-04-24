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
import { withTestDevices, coordinations, teams, users } from '../../../utils/constants/filters';
import managementDevicesColumns from '../constants/managementDevicesColumns';
import { devicesActions } from '../redux/devices';
import SearchButton from '../../../components/SearchButton';
import { filterActions } from '../../../redux/filtersRedux';

const baseUrl = 'devices';

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
            tableUrl: null,
        };
    }

    componentWillMount() {
        if (this.props.params.back) {
            this.onSearch();
            const { params } = this.props;
            delete params.back;
            this.props.redirectTo(baseUrl, params);
        }
        this.props.fetchTeams();
        this.props.fetchCoordinations();
        this.props.fetchProfiles();
    }

    onSearch() {
        this.setState({
            tableUrl: this.getEndpointUrl(),
        });
    }

    getEndpointUrl() {
        let url = '/api/devices/?';
        const {
            params,
        } = this.props;

        const urlParams = {
            ...params,
        };

        Object.keys(urlParams).forEach((key) => {
            const value = urlParams[key];
            if (value && !url.includes(key)) {
                url += `&${key}=${value}`;
            }
        });
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
            filters,
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

                <div className="widget__container ">
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <FormattedMessage id="teamsdevices.header.results" defaultMessage="Synchronisation des Appareils" />
                        </h2>
                    </div>
                    <div className="widget__content--tier">
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl={baseUrl}
                                filters={[
                                    users(filters.profiles, {
                                        id: 'main.label.lastUser',
                                        defaultMessage: 'Dernier utilisateur',
                                    }, true, 'profile_id'),
                                    withTestDevices(),
                                ]}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl={baseUrl}
                                filters={[
                                    teams(filters.teams),
                                ]}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl={baseUrl}
                                filters={[
                                    coordinations(filters.coordinations),
                                ]}
                            />
                        </div>
                    </div>
                    <SearchButton onSearch={() => this.onSearch()} />
                </div>
                {
                    this.state.tableUrl &&
                    <div className="widget__container" data-qa="monthly-report-data-loaded">
                        <CustomTableComponent
                            selectable
                            isSortable
                            showPagination={false}
                            endPointUrl={this.state.tableUrl}
                            columns={this.state.tableColumns}
                            defaultSorted={[{ id: 'last_synced_date', desc: false }]}
                            params={this.props.params}
                            defaultPath={baseUrl}
                            canSelect={false}
                            onDataLoaded={(newDevicesList, count, pages) => setDevicesList(newDevicesList, false, params, count, pages)}
                            multiSort
                            reduxPage={reduxPage}
                        />
                    </div>
                }
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
    fetchCoordinations: PropTypes.func.isRequired,
    fetchTeams: PropTypes.func.isRequired,
    fetchProfiles: PropTypes.func.isRequired,
    filters: PropTypes.object.isRequired,
};
const MapStateToProps = state => ({
    config: state.config,
    load: state.load,
    reduxPage: state.devices.devicesPage,
    filters: state.devicesFilters,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    fetchTeams: () => dispatch(filterActions.fetchTeams(dispatch)),
    fetchProfiles: () => dispatch(filterActions.fetchProfiles(dispatch)),
    fetchCoordinations: () => dispatch(filterActions.fetchCoordinations(dispatch)),
    setDevicesList: (devicesList, showPagination, params, count, pages) => dispatch(devicesActions.setDevicesList(devicesList, showPagination, params, count, pages)),
});


export default connect(MapStateToProps, MapDispatchToProps)(ManagementDevicesWithIntl);
