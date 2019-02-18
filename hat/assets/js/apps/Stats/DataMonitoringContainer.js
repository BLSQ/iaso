import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { clone, deepEqual } from '../../utils';
import { fetchUrls } from '../../utils/fetchData';
import DataMonitoringComponent from './pages/DataMonitoring';
import { dataMonitoringUrls } from './constants/urls';

export class DataMonitoringContainer extends Component {
    constructor(props) {
        super(props);
        this.currentParams = '';
    }

    componentDidMount() {
        this.loadData(this.props.params);
    }
    componentWillReceiveProps(nextProps) {
        if (!deepEqual(this.props.params, nextProps.params)) {
            this.loadData(nextProps.params);
        }
    }

    loadData(params) {
        const {
            dispatch,
        } = this.props;
        const oldParams = clone(this.currentParams);
        this.currentParams = clone(params);
        fetchUrls(dataMonitoringUrls, params, oldParams, dispatch);
    }

    render() {
        const {
            params,
            load,
        } = this.props;
        return <DataMonitoringComponent params={params} load={load} />;
    }
}

DataMonitoringContainer.propTypes = {
    load: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
    filters: state.filters,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
});

const DataMonitoringContainerWithIntl = injectIntl(DataMonitoringContainer);
export default connect(MapStateToProps, MapDispatchToProps)(DataMonitoringContainerWithIntl);
