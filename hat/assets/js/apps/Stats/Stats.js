import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import {
    FormattedMessage,
    injectIntl,
    defineMessages,
} from 'react-intl';
import DatePickerStyles from 'react-datepicker/dist/react-datepicker.css'; // eslint-disable-line no-unused-vars
import MGStyles from 'metrics-graphics/dist/metricsgraphics.css'; // eslint-disable-line no-unused-vars
import LoadingSpinner from '../../components/loading-spinner';
import { createUrl } from '../../utils/fetchData';
import Widgets from './components/Widgets';


const MESSAGES = defineMessages({
    'location-all': {
        defaultMessage: 'All',
        id: 'stats.labels.all',
    },
    loading: {
        defaultMessage: 'Loading',
        id: 'stats.labels.loading',
    },
});

export class Stats extends Component {
    constructor() {
        super();
        this.dateFormat = 'YYYY-MM-DD';
        this.datefromHandler = this.datefromHandler.bind(this);
        this.datetoHandler = this.datetoHandler.bind(this);
        this.locationHandler = this.locationHandler.bind(this);
    }

    datefromHandler(date) {
        const url = createUrl({
            ...this.props.params,
            date_from: moment(date).format(this.dateFormat),
        });
        this.props.dispatch(push(url));
    }

    datetoHandler(date) {
        const url = createUrl({
            ...this.props.params,
            date_to: moment(date).format(this.dateFormat),
        });
        this.props.dispatch(push(url));
    }

    locationHandler(event) {
        const location = event.target.value;
        const url = createUrl({ ...this.props.params, location });
        this.props.dispatch(push(url));
    }

    render() {
        const { formatMessage } = this.props.intl;
        const { date_from, date_to, location } = this.props.params;
        const { loading, data, error } = this.props.report;
        const locations = (data && data.locations) || [];
        const pickerFrom = date_from ? moment(date_from) : moment();
        const pickerTo = date_to ? moment(date_to) : moment();

        return (
            <div>
                <div className="filter__container">

                    <h2 className="filter__label"><FormattedMessage id="statspage.label.select" defaultMessage="Select:" /></h2>
                    <div className="filter__container__select date-select">
                        <label htmlFor="date-from" className="filter__container__select__label"><i className="fa fa-calendar" /><FormattedMessage id="statspage.label.datefrom" defaultMessage="From" /></label>
                        <DatePicker
                            dateFormat={this.dateFormat}
                            dateFormatCalendar={this.dateFormat}
                            selected={pickerFrom}
                            onChange={this.datefromHandler}
                        />
                    </div>

                    <div className="filter__container__select date-select">
                        <label htmlFor="date-to" className="filter__container__select__label"><i className="fa fa-calendar" /><FormattedMessage id="statspage.label.dateto" defaultMessage="To" /></label>
                        <DatePicker
                            dateFormat={this.dateFormat}
                            dateFormatCalendar={this.dateFormat}
                            selected={pickerTo}
                            onChange={this.datetoHandler}
                        />
                    </div>

                    {locations.length > 0 && (
                        <div className="filter__container__select">
                            <label htmlFor="location" className="filter__container__select__label"><i className="fa fa-globe" /><FormattedMessage id="statspage.label.location" defaultMessage="Location" /></label>
                            <select disabled={loading} name="location" value={location || ''} onChange={this.locationHandler} className="select--minimised">
                                <option key="all" value="">
                                    {formatMessage(MESSAGES['location-all'])}
                                </option>
                                {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                {
                    error &&
                    <div className="widget__container">
                        <div className="widget__header">
                            <h2 className="widget__heading text--error"><FormattedMessage id="statspage.header.error" defaultMessage="Error:" /></h2>
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
                    data && <Widgets data={data} />
                }
            </div>
        );
    }
}

Stats.propTypes = {
    report: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
};

const MapDispatchToProps = dispatch => ({
    dispatch,
});

const MapStateToProps = state => ({
    config: state.config,
    report: state.report,
});

const StatsWithIntl = injectIntl(Stats);

export default connect(MapStateToProps, MapDispatchToProps)(StatsWithIntl);

