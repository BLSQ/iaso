
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
import Filters from '../Locator/components/Filters';
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
        this.provinceHandler = this.provinceHandler.bind(this);
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

    provinceHandler(province_id) {
        const url = createUrl({ ...this.props.params, province_id });
        this.props.dispatch(push(url));
    }

    render() {
        const { formatMessage } = this.props.intl;
        const { date_from, date_to, province_id } = this.props.params;
        const { data } = this.props.load;
        let showLoading = true;
        if (data) {
            const { loading } = data;
            showLoading = loading;
        }
        const pickerFrom = date_from ? moment(date_from) : moment();
        const pickerTo = date_to ? moment(date_to) : moment();
        let filters;
        if (data) {
            filters = {
                provinces: data.provinces,
                provinceId: parseInt(province_id, 10),
            };
        }
        return (
            <div>
                <div className="stats-filters widget__container">
                    <div>
                        <div>
                            <div className="filter__container__select date-select">
                                <label htmlFor="date-from" className="filter__container__select__label"><i className="fa fa-calendar" /><FormattedMessage id="statspage.label.datefrom" defaultMessage="From" /></label>
                                <DatePicker
                                    dateFormat={this.dateFormat}
                                    dateFormatCalendar={this.dateFormat}
                                    selected={pickerFrom}
                                    onChange={this.datefromHandler}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="filter__container__select date-select">
                                <label htmlFor="date-to" className="filter__container__select__label"><i className="fa fa-calendar" /><FormattedMessage id="statspage.label.dateto" defaultMessage="To" /></label>
                                <DatePicker
                                    dateFormat={this.dateFormat}
                                    dateFormatCalendar={this.dateFormat}
                                    selected={pickerTo}
                                    onChange={this.datetoHandler}
                                />
                            </div>
                        </div>
                        {data &&
                            <Filters
                                isMultiSelect={false} // need to update api to work with multiple ids
                                showVillages={false}
                                isClearable
                                filters={filters}
                                selectProvince={provinceId => this.provinceHandler(provinceId)}
                                selectZone={zsId => this.selectZone(zsId)}
                                selectArea={asId => this.selectArea(asId)}
                            />
                        }
                    </div>
                </div>

                {
                    showLoading && <LoadingSpinner message={formatMessage(MESSAGES.loading)} />
                }
                {
                    data && <Widgets data={data} />
                }
            </div>
        );
    }
}

Stats.propTypes = {
    params: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
};

const MapDispatchToProps = dispatch => ({
    dispatch,
});

const MapStateToProps = state => ({
    filters: state.filters,
    load: state.load,
});

const StatsWithIntl = injectIntl(Stats);

export default connect(MapStateToProps, MapDispatchToProps)(StatsWithIntl);

