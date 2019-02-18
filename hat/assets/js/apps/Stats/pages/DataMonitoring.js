
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import {
    FormattedMessage,
    injectIntl,
    defineMessages,
} from 'react-intl';

import MGStyles from 'metrics-graphics/dist/metricsgraphics.css'; // eslint-disable-line no-unused-vars
import LoadingSpinner from '../../../components/loading-spinner';
import { createUrl } from '../../../utils/fetchData';
import Widgets from '../components/DataMonitoringWidgets';
import { filterActions } from '../../../redux/filtersRedux';
import FiltersComponent from '../../../components/FiltersComponent';
import { filtersGeo, filtersCoordinations } from '../constants/statsFilters';
import PeriodSelectorComponent from '../../../components/PeriodSelectorComponent';

const baseUrl = 'data_monitoring';

const MESSAGES = defineMessages({
    'location-all': {
        defaultMessage: 'All',
        id: 'DataMonitoring.labels.all',
    },
    loading: {
        defaultMessage: 'Loading',
        id: 'DataMonitoring.labels.loading',
    },
});

export class DataMonitoring extends Component {
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
        this.props.redirectTo(baseUrl, newParams);
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
        const geo = filtersGeo(
            filters.provinces || [],
            filters.zones || [],
            filters.areas || [],
            this,
        );
        return (
            <div>
                <div className="widget__container">
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <FormattedMessage
                                id="DataMonitoring.title"
                                defaultMessage="Monitorage de données"
                            />
                        </h2>
                    </div>
                </div>
                <div className="widget__container">
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <PeriodSelectorComponent
                                dateFrom={date_from}
                                dateTo={date_to}
                                onChangeDate={(dateFrom, dateTo) =>
                                    this.props.redirectTo(baseUrl, {
                                        ...this.props.params,
                                        date_from: dateFrom,
                                        date_to: dateTo,
                                    })}
                            />
                        </h2>
                    </div>
                </div>
                <div className="widget__container widget__content--quarter">
                    <div>
                        {data &&
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl={baseUrl}
                                filters={filtersCoordinations(this.props.load.data.coordinations.map(coordination => ({ label: coordination.name, value: coordination.id })))}
                            />
                        }
                    </div>
                    <div>
                        {data &&
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl={baseUrl}
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

DataMonitoring.propTypes = {
    filters: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    fetchProvinces: PropTypes.func.isRequired,
    selectProvince: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectArea: PropTypes.func.isRequired,
    redirectTo: PropTypes.func.isRequired,
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

const DataMonitoringWithIntl = injectIntl(DataMonitoring);

export default connect(MapStateToProps, MapDispatchToProps)(DataMonitoringWithIntl);

