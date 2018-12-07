import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import VectorElement from './pages/Vector';
import {
    fetchSites,
    fetchTargets,
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
        dispatch(loadActions.startLoading());
        const promises = [];
        if (params.sites || params.tab === 'sites') {
            promises.push(fetchSites(dispatch, params.date_from, params.date_to));
        }
        if (params.targets || params.tab === 'targets') {
            promises.push(fetchTargets(dispatch, params.date_from, params.date_to));
        }
        if (params.endemicVillages) {
            promises.push(fetchEndemicVillages(dispatch, params.date_from, params.date_to));
        }
        if (params.nonEndemicVillages) {
            promises.push(fetchNonEndemicVillages(dispatch, params.date_from, params.date_to));
        }
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
            const paramsChanged = (newProps.params.date_from !== this.props.params.date_from) ||
                                  (newProps.params.date_to !== this.props.params.date_to);
            if ((paramsChanged && newProps.params.sites) ||
                (newProps.params.sites && !this.props.vectors.sites) ||
                (newProps.params.tab === 'sites' && !this.props.vectors.targets)) {
                promises.push(fetchSites(dispatch, newProps.params.date_from, newProps.params.date_to));
            }
            if ((paramsChanged && newProps.params.targets) ||
                (newProps.params.targets && !this.props.vectors.targets) ||
                (newProps.params.tab === 'targets' && !this.props.vectors.targets)) {
                promises.push(fetchTargets(dispatch, newProps.params.date_from, newProps.params.date_to));
            }

            if ((paramsChanged && newProps.params.endemicVillages) ||
                (newProps.params.endemicVillages && !this.props.vectors.endemicVillages)) {
                promises.push(fetchEndemicVillages(dispatch, newProps.params.date_from, newProps.params.date_to));
            }
            if ((paramsChanged && newProps.params.nonEndemicVillages) ||
                (newProps.params.nonEndemicVillages && !this.props.vectors.nonEndemicVillages)) {
                promises.push(fetchNonEndemicVillages(dispatch, newProps.params.date_from, newProps.params.date_to));
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
