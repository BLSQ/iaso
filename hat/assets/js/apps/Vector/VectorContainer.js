import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import VectorElement from './Vector';
import { vectorActions } from './redux/vectorReducer';
import { loadActions } from '../../redux/load';

const request = require('superagent');

export const urls = [];

class VectorContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        this.fetchTraps();
        this.fetchLocations();
    }

    fetchLocations() {
        const { dispatch } = this.props;
        dispatch(loadActions.startLoading());
        return request
            .get('/api/zs/')
            .then((result) => {
                dispatch(vectorActions.loadLocations(result.body));
                dispatch(loadActions.successLoadingNoData());
            })
            .catch((err) => {
                dispatch(loadActions.errorLoading(err));
                console.error('Error when fetching traps', err);
            });
    }

    fetchTraps() {
        const { dispatch } = this.props;
        dispatch(loadActions.startLoading());
        return request
            .get(`/api/traps?from=${this.props.params.date_from}&to=${this.props.params.date_to}`)
            .then((result) => {
                dispatch(vectorActions.loadTraps(result.body));
                dispatch(loadActions.successLoadingNoData());
            })
            .catch((err) => {
                dispatch(loadActions.errorLoading(err));
                console.error('Error when fetching traps', err);
            });
    }

    fetchTargets() {
        const { dispatch } = this.props;
        dispatch(loadActions.startLoading());
        return request
            .get(`/api/targets?from=${this.props.params.date_from}&to=${this.props.params.date_to}`)
            .then((result) => {
                dispatch(vectorActions.loadTargets(result.body));
                dispatch(loadActions.successLoadingNoData());
            })
            .catch((err) => {
                dispatch(loadActions.errorLoading(err));
                console.error('Error when fetching targets', err);
            });
    }

    fetchVillages(withNegativeCases, withPositiveCases, zsIds = this.props.params.zs_id) {
        const { dispatch } = this.props;
        dispatch(loadActions.startLoading());
        let filterCases = '';
        let filterLocations = '';
        if (withPositiveCases && !withNegativeCases) {
            filterCases = '&results=positive';
        }
        if (!withPositiveCases && withNegativeCases) {
            filterCases = '&results=negative';
        }
        if (zsIds) {
            filterLocations = `&zs_id=${zsIds}`;
        }
        return request
            .get(`/api/villages?from=${this.props.params.date_from}&to=${this.props.params.date_to}${filterCases}${filterLocations}`)
            .then((result) => {
                dispatch(vectorActions.loadVillages(result.body));
                dispatch(loadActions.successLoadingNoData());
            })
            .catch((err) => {
                dispatch(loadActions.errorLoading(err));
                console.error('Error when fetching villages', err);
            });
    }

    render() {
        return (
            <VectorElement
                fetchTraps={() => this.fetchTraps()}
                fetchTargets={() => this.fetchTargets()}
                fetchVillages={(withNegativeCases, withPositiveCases) =>
                    this.fetchVillages(withNegativeCases, withPositiveCases)}
                params={this.props.params}
            />
        );
    }
}


VectorContainer.propTypes = {
    params: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
    infos: state.infos,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
});

export default connect(MapStateToProps, MapDispatchToProps)(VectorContainer);
