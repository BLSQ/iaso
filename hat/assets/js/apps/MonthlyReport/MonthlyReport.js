import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import {
    FormattedMessage,
    injectIntl,
    defineMessages,
} from 'react-intl';
import DataTableComponent from './components/DataTableComponent';
import LoadingSpinner from '../../components/loading-spinner';
import { createUrl } from '../../utils/fetchData';

const MESSAGES = defineMessages({
    'location-all': {
        defaultMessage: 'All',
        id: 'monthlyreport.labels.all',
    },
    loading: {
        defaultMessage: 'Loading',
        id: 'monthlyreport.labels.loading',
    },
});

export class MonthlyReport extends Component {
    constructor(props) {
        super(props);
        this.dateHandler = this.dateHandler.bind(this);
        this.locationHandler = this.locationHandler.bind(this);
    }

    dateHandler(event) {
        const url = createUrl({ ...this.props.params, date_month: event.target.value });
        this.props.dispatch(push(url));
    }

    locationHandler(event) {
        const url = createUrl({ ...this.props.params, location: event.target.value });
        this.props.dispatch(push(url));
    }

    render() {
        const { formatMessage } = this.props.intl;
        const { location } = this.props.params;
        const { dates } = this.props.config;
        const { loading, data, error } = this.props.report;
        const locations = (data && data.locations) || [];
        const dateMonth = this.props.params.date_month || '';
        return (
            <div>
                <div className="filter__container">
                    <h2 className="filter__label"><FormattedMessage id="monthlyreport.label.select" defaultMessage="Select:" /></h2>
                    <div className="filter__container__select">
                        <label htmlFor="dateMonth" className="filter__container__select__label"><i className="fa fa-calendar" /><FormattedMessage id="monthlyreport.label.month" defaultMessage="Month" /></label>
                        <select disabled={loading} name="dateMonth" value={dateMonth} onChange={this.dateHandler} className="select--minimised">
                            {dates.map(date => <option key={date} value={date}>{date}</option>)}
                        </select>
                    </div>
                    {
                        locations.length > 0 &&
                        <div className="filter__container__select">
                            <label htmlFor="location" className="filter__container__select__label"><i className="fa fa-globe" /><FormattedMessage id="monthlyreport.label.location" defaultMessage="Location" /></label>
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
                            <h2 className="widget__heading text--error"><FormattedMessage id="monthlyreport.header.error" defaultMessage="Error:" /></h2>
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
                    data && <DataTableComponent data={data} />
                }
            </div>
        );
    }
}


MonthlyReport.propTypes = {
    config: PropTypes.object.isRequired,
    report: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
};

const MonthlyReportWithIntl = injectIntl(MonthlyReport);
const MapDispatchToProps = dispatch => ({
    dispatch,
});

const MapStateToProps = state => ({
    config: state.config,
    report: state.report,
});


export default connect(MapStateToProps, MapDispatchToProps)(MonthlyReportWithIntl);
