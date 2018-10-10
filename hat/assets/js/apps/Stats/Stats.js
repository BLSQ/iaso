
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
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
import { filterActions } from '../../redux/filtersRedux';
import FiltersComponent from '../../components/FiltersComponent';
import filtersGeo from './constants/statsFilters';


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
    }

    componentDidMount() {
        const {
            params: {
                province_id,
                zs_id,
                as_id,
            },
        } = this.props;
        this.props.fetchProvinces();
        if (province_id) {
            this.props.selectProvince(province_id, zs_id, as_id);
        }
        if (zs_id) {
            this.props.selectZone(zs_id);
        }
        if (as_id) {
            this.props.selectArea(as_id);
        }
    }

    componentWillReceiveProps(newProps) {
        const {
            params: {
                province_id,
                zs_id,
                as_id,
            },
        } = newProps;
        if (province_id !== this.props.params.province_id) {
            this.props.selectProvince(province_id);
        }
        if (zs_id !== this.props.params.zs_id) {
            this.props.selectZone(zs_id);
        }
        if (as_id !== this.props.params.as_id) {
            this.props.selectArea(as_id, zs_id);
        }
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

    paramChangeHandler(key, value) {
        const newParams = {
            ...this.props.params,
        };
        if (key === 'province_id') {
            delete newParams.zs_id;
            delete newParams.as_id;
        }
        if (key === 'zs_id') {
            delete newParams.as_id;
        }
        newParams[key] = value;
        const url = createUrl(newParams);
        this.props.dispatch(push(url));
    }

    render() {
        const { formatMessage } = this.props.intl;
        const { date_from, date_to } = this.props.params;
        const { data } = this.props.load;
        const { filters } = this.props;
        let showLoading = true;
        if (data) {
            const { loading } = this.props.load;
            showLoading = loading;
        }
        const pickerFrom = date_from ? moment(date_from) : moment();
        const pickerTo = date_to ? moment(date_to) : moment();
        const geo = filtersGeo(
            filters.provinces || [],
            filters.zones || [],
            filters.areas || [],
            this,
        );
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
                    </div>
                </div>
                <div className="widget__container widget__content--quarter">
                    <div>
                        {data &&
                            <div className="locator-filter">
                                <div className="locator-subtitle">
                                    <FormattedMessage id="stats.label.coordinations" defaultMessage="Coordinations" />
                                </div>
                                <Select
                                    clearable
                                    simpleValue
                                    name="coordination_id"
                                    value={this.props.params.coordination_id}
                                    placeholder="--"
                                    options={this.props.load.data.coordinations.map(coordination => ({ label: coordination.name, value: coordination.id }))}
                                    onChange={coordination_id => this.paramChangeHandler('coordination_id', coordination_id)}
                                    noResultsText={<FormattedMessage id="locator.label.noresult" defaultMessage="Aucun village trouvé" />}
                                />
                            </div>
                        }
                    </div>
                    <div>
                        {data &&
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl="charts"
                                filters={geo}
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
    filters: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    fetchProvinces: PropTypes.func.isRequired,
    selectProvince: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectArea: PropTypes.func.isRequired,
};

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    fetchProvinces: () => dispatch(filterActions.fetchProvinces(dispatch)),
    selectProvince: provinceId => dispatch(filterActions.selectProvince(provinceId, dispatch)),
    selectZone: zoneId => dispatch(filterActions.selectZone(zoneId, dispatch, false, null)),
    selectArea: (areaId, zoneId) => dispatch(filterActions.selectArea(areaId, dispatch, false, zoneId)),
});

const MapStateToProps = state => ({
    filters: state.filters,
    load: state.load,
});

const StatsWithIntl = injectIntl(Stats);

export default connect(MapStateToProps, MapDispatchToProps)(StatsWithIntl);

