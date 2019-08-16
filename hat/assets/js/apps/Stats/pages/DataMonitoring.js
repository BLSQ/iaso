
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
import PeriodSelectorComponent from '../../../components/PeriodSelectorComponent';
import minDateDataMonitoring from '../constants';

const baseUrl = 'data_monitoring';

const MESSAGES = defineMessages({
    'location-all': {
        defaultMessage: 'All',
        id: 'main.label.allMale',
    },
    loading: {
        defaultMessage: 'Loading',
        id: 'main.label.loading',
    },
});

export class DataMonitoring extends Component {
    paramChangeHandler(key, value) {
        const newParams = {
            ...this.props.params,
        };
        newParams[key] = value;
        this.props.redirectTo(baseUrl, newParams);
    }

    render() {
        const { formatMessage } = this.props.intl;
        const { date_from, date_to } = this.props.params;
        const { data } = this.props.load;
        let showLoading = true;
        if (data) {
            const { loading } = this.props.load;
            showLoading = loading;
        }
        return (
            <div>
                <div className="widget__container">
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <FormattedMessage
                                id="dataMonitoring.title"
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
                                minDate={minDateDataMonitoring}
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
    params: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
};

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

const MapStateToProps = state => ({
    load: state.load,
});

const DataMonitoringWithIntl = injectIntl(DataMonitoring);

export default connect(MapStateToProps, MapDispatchToProps)(DataMonitoringWithIntl);

