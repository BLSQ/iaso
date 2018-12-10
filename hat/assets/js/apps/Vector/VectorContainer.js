import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import VectorElement from './pages/Vector';
import {
    fetchSites,
    fetchTargets,
    fetchPaginatedSites,
    fetchPaginatedTargets,
    fetchNonEndemicVillages,
    fetchEndemicVillages,
} from './utlls';
import { loadActions } from '../../redux/load';


class VectorContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        const { params, dispatch } = this.props;
        const promises = [];
        if (params.sites && params.tab === 'map') {
            promises.push(fetchSites(dispatch, params.date_from, params.date_to));
        }
        if (params.targets && params.tab === 'map') {
            promises.push(fetchTargets(dispatch, params.date_from, params.date_to));
        }
        if (params.endemicVillages === 'true' && params.tab === 'map') {
            promises.push(fetchEndemicVillages(dispatch, params.date_from, params.date_to));
        }
        if (params.nonEndemicVillages === 'true' && params.tab === 'map') {
            promises.push(fetchNonEndemicVillages(dispatch, params.date_from, params.date_to));
        }
        if (params.tab === 'sites') {
            promises.push(fetchPaginatedSites(dispatch, params, params.sitesPageSize, params.sitesPage, params.orderSites));
        }
        if (params.tab === 'targets') {
            promises.push(fetchPaginatedTargets(dispatch, params, params.targetsPageSize, params.targetsPage, params.orderTargets));
        }
        dispatch(loadActions.startLoading());
        Promise.all(promises).then(() => {
            dispatch(loadActions.successLoadingNoData());
        }).catch((err) => {
            dispatch(loadActions.errorLoading(err));
        });
    }

    componentWillReceiveProps(newProps) {
        const { dispatch } = this.props;
        if (!newProps.load.loading && !this.props.load.loading) {
            const promises = [];

            const hasChanged = (prev, curr, key) => (prev[key] !== curr[key]);
            const paramsChanged = hasChanged(this.props.params, newProps.params, 'date_from') ||
                hasChanged(this.props.params, newProps.params, 'date_to');
            const sitesTableChanged = hasChanged(this.props.params, newProps.params, 'sitesPage') ||
                hasChanged(this.props.params, newProps.params, 'sitesPageSize') ||
                hasChanged(this.props.params, newProps.params, 'orderSites');
            const targetsTableChanged = hasChanged(this.props.params, newProps.params, 'targetsPage') ||
                hasChanged(this.props.params, newProps.params, 'targetsPageSize') ||
                hasChanged(this.props.params, newProps.params, 'orderTargets');

            if ((paramsChanged && newProps.params.sites) ||
                (newProps.params.sites && !this.props.vectors.sites && newProps.params.tab === 'map')) {
                promises.push(fetchSites(dispatch, newProps.params.date_from, newProps.params.date_to));
            }
            if ((paramsChanged && newProps.params.targets) ||
                (newProps.params.targets && !this.props.vectors.targets && newProps.params.tab === 'map')) {
                promises.push(fetchTargets(dispatch, newProps.params.date_from, newProps.params.date_to));
            }
            if ((paramsChanged && newProps.params.endemicVillages) ||
                (newProps.params.endemicVillages && !this.props.vectors.endemicVillages && newProps.params.tab === 'map')) {
                promises.push(fetchEndemicVillages(dispatch, newProps.params.date_from, newProps.params.date_to));
            }
            if ((paramsChanged && newProps.params.nonEndemicVillages) ||
                (newProps.params.nonEndemicVillages && !this.props.vectors.nonEndemicVillages && newProps.params.tab === 'map')) {
                promises.push(fetchNonEndemicVillages(dispatch, newProps.params.date_from, newProps.params.date_to));
            }

            if (paramsChanged || ((sitesTableChanged || !this.props.vectors.sitesPage.list) && newProps.params.tab === 'sites')) {
                promises.push(fetchPaginatedSites(dispatch, newProps.params, newProps.params.sitesPageSize, newProps.params.sitesPage, newProps.params.orderSites));
            }
            if (paramsChanged || ((targetsTableChanged || !this.props.vectors.targetsPage.list) && newProps.params.tab === 'targets')) {
                promises.push(fetchPaginatedTargets(dispatch, newProps.params, newProps.params.targetsPageSize, newProps.params.targetsPage, newProps.params.orderTargets));
            }
            if (promises.length > 0) {
                dispatch(loadActions.startLoading());
                Promise.all(promises).then(() => {
                    dispatch(loadActions.successLoadingNoData());
                }).catch((err) => {
                    dispatch(loadActions.errorLoading(err));
                });
            }
        }
    }

    render() {
        return (
            <VectorElement params={this.props.params} />
        );
    }
}


VectorContainer.propTypes = {
    dispatch: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
    vectors: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
    infos: state.infos,
    vectors: state.vectors,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
});

export default connect(MapStateToProps, MapDispatchToProps)(VectorContainer);
