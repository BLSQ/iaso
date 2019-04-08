import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { clone, deepEqual } from '../../utils';
import { fetchUrls } from '../../utils/fetchData';
import EpidemiologyComponent from './pages/Epidemiology';
import { epidemiologyUrls } from './constants/urls';

export class EpidemiologyContainer extends Component {
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
        fetchUrls(epidemiologyUrls, params, oldParams, dispatch);
    }

    render() {
        const {
            params,
            load,
        } = this.props;
        return <EpidemiologyComponent params={params} load={load} />;
    }
}

EpidemiologyContainer.propTypes = {
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

const EpidemiologyContainerWithIntl = injectIntl(EpidemiologyContainer);
export default connect(MapStateToProps, MapDispatchToProps)(EpidemiologyContainerWithIntl);
