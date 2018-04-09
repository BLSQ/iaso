import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import {
    FormattedMessage,
    injectIntl,
    defineMessages,
} from 'react-intl';

import DeviceEventsList from '../components/DeviceEventsListComponent';
import DeviceEventForm from '../components/DeviceEventFormComponent';
import DataTable from '../components/DataTableComponent';
import LoadingSpinner from '../../../components/loading-spinner';
import Modal from '../../../components/modal';
import { clone } from '../../../utils';
import { createUrl, fetchUrls, checkLocation } from '../../../utils/fetchData';

export const urls = [
    {
        name: 'locations',
        url: '/api/datasets/list_locations/',
        mock: ['Mosango', 'Yasa Bonga'],
    },
    {
        name: 'meta',
        url: '/api/datasets/campaign_meta/',
        mock: {
            enddate: '2016-08-29T10:58:42.807000Z', startdate: '2016-08-11T08:18:43.559000Z', as_visited: 1, villages_visited: 4,
        },
    },
    {
        name: 'device_status',
        url: '/api/datasets/device_status/',
    },
];

const MESSAGES = defineMessages({
    'location-all': {
        defaultMessage: 'All',
        id: 'teamsdevices.labels.all',
    },
    loading: {
        defaultMessage: 'Loading',
        id: 'teamsdevices.labels.loading',
    },
});

export class ManagementDevices extends Component {
    constructor() {
        super();
        this.currentParams = '';
        this.dateHandler = this.dateHandler.bind(this);
        this.locationHandler = this.locationHandler.bind(this);
        this.state = {
            isOpen: false,
            currentDeviceId: false,
            edit: false,
        };
    }

    componentDidMount() {
        this.loadData(this.props.params);
    }

    componentWillReceiveProps(newProps) {
        this.loadData(newProps.params);
    }

    loadData(params) {
        const { dispatch } = this.props;
        const oldParams = clone(this.currentParams);
        this.currentParams = clone(params);
        // force the source to `mobile`
        // (includes `mobile_backup` and `mobile_sync`)
        // (it makes no sense with `historical` or `pv` data)
        const source = 'mobile';

        // to avoid fetching again because params changed include it in both sides, new and old.
        fetchUrls(urls, { ...params, source }, { ...oldParams, source }, dispatch, checkLocation);
    }

    dateHandler(event) {
        const url = createUrl({ ...this.props.params, date_month: event.target.value });
        this.props.dispatch(push(url));
    }

    locationHandler(event) {
        const url = createUrl({ ...this.props.params, location: event.target.value });
        this.props.dispatch(push(url));
    }

    toggleModal(edit, event, deviceId) {
        if (event) {
            event.stopPropagation();
            event.nativeEvent.stopImmediatePropagation();
        }
        this.setState({
            isOpen: !this.state.isOpen,
            currentDeviceId: deviceId,
            edit,
        });
    }
    render() {
        const { formatMessage } = this.props.intl;
        const { location } = this.props.params;
        const { dates } = this.props.config;
        const { loading, data, error } = this.props.load;
        const locations = (data && data.locations) || [];
        const dateMonth = this.props.params.date_month || '';
        let modalContent;
        if (this.state.edit) {
            modalContent = <DeviceEventForm deviceId={this.state.currentDeviceId} />;
        } else {
            modalContent = <DeviceEventsList deviceId={this.state.currentDeviceId} />;
        }

        return (
            <div>
                <Modal show={this.state.isOpen} onClose={() => this.toggleModal(this, false)}>
                    {modalContent}
                </Modal>
                <div className="filter__container">
                    <h2 className="filter__label"><FormattedMessage id="teamsdevices.label.select" defaultMessage="Select:" /></h2>
                    <div className="filter__container__select">
                        <label htmlFor="dateMonth" className="filter__container__select__label"><i className="fa fa-calendar" /><FormattedMessage id="teamsdevices.label.month" defaultMessage="Month" /></label>
                        <select disabled={loading} name="dateMonth" value={dateMonth} onChange={this.dateHandler} className="select--minimised">
                            {dates.map(date => <option key={date} value={date}>{date}</option>)}
                        </select>
                    </div>
                    {
                        locations.length > 0 &&
                        <div className="filter__container__select">
                            <label htmlFor="location" className="filter__container__select__label"><i className="fa fa-globe" /><FormattedMessage id="teamsdevices.label.location" defaultMessage="Location" /></label>
                            <select disabled={loading} name="location" value={location || ''} onChange={this.locationHandler} className="select--minimised">
                                <option key="all" value="">
                                    {formatMessage(MESSAGES['location-all'])}
                                </option>
                                {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                            </select>
                        </div>
                    }
                </div>

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
                {
                    data &&
                        <DataTable
                            data={data}
                            auditClickHandler={() => this.toggleModal(this, true)}
                            moreClickHandler={() => this.toggleModal(this, false)}
                        />
                }
            </div>
        );
    }
}

const ManagementDevicesWithIntl = injectIntl(ManagementDevices);


ManagementDevices.defaultProps = {
};

ManagementDevices.propTypes = {
    params: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    config: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
};
const MapStateToProps = state => ({
    config: state.config,
    load: state.load,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
});


export default connect(MapStateToProps, MapDispatchToProps)(ManagementDevicesWithIntl);
