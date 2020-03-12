/*
 * The MicroplanningContainer is responsible for loading data
 * for the micro-planning
 *
 * It has a few behaviors:
 * - load data when mounted
 * - make sure only filter params changing triggers a new data load
 * - emit success/fail events
 *
 * Handles state and data loading for the Microplanning page
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { getUrl } from '../../utils/routesUtils';
import { launchAlgo } from '../../utils/fetchData';
import MicroplanningComponent from './Microplanning';
import { selectionActions } from './redux/selection';
import { mapActions } from './redux/map';
import { currentUserActions } from '../../redux/currentUserReducer';
import {
    setCoordinations,
    setPlannings,
    setTeams,
    setWorkzones,
    setVillages,
    getAssignations,
} from './redux/microplanning';
import { fetchMutliRequests, fetchRequest } from '../../utils/requests';


const getUrls = (params) => {
    let urls = [
        {
            url: getUrl('coordinations', params),
            action: setCoordinations,
        },
        {
            url: getUrl('plannings', params),
            action: setPlannings,
        },
    ];
    if (params.planning_id) {
        urls = urls.concat(
            [
                {
                    url: getUrl('teams', params),
                    action: setTeams,
                },
                {
                    url: `${getUrl('workzones', params)}${params.workzone_id ? '?with_areas=False' : ''}`,
                    action: setWorkzones,
                },
                {
                    url: getUrl('villages', params),
                    action: setVillages,
                },
            ],
        );
    }
    return urls;
};

export class MicroplanningContainer extends Component {
    constructor(props) {
        super(props);
        this.currentParams = '';
        this.state = {
            isAssignationLoading: Boolean(props.params.workzone_id),
        };
    }

    componentDidMount() {
        const { params } = this.props;
        this.props.fetchMutliRequests(getUrls(params)).then(() => {
            if (params.workzone_id) {
                this.getAdditionalSelectData();
            }
            this.props.changeCluster(!params.workzone_id);
        });
        this.props.fetchCurrentUserInfos();
    }

    getAdditionalSelectData(params = this.props.params) {
        const { dispatch } = this.props;
        const newParams = Object.assign({}, params);
        delete newParams.team_id;
        this.setState({
            isAssignationLoading: true,
        });
        this.props.fetchRequest(
            getUrl('assignations', newParams),
            getAssignations,
        )
            .then((result) => {
                this.selectItems(result, false);
                this.setState({
                    isAssignationLoading: false,
                });
            });

        if (params.team_id) {
            dispatch(selectionActions.getTeamDetails(dispatch, params.team_id, params.planning_id));
        }
    }

    launchAlgo(algoParams) {
        const { dispatch } = this.props;
        launchAlgo(algoParams, dispatch)
            .then((result) => {
                this.selectItems(result.assignations, true);
            });
    }

    selectItems(items, activateSaveButton) {
        const { dispatch } = this.props;
        dispatch(selectionActions.deselectItems(null, false));
        dispatch(selectionActions.selectItems(items, activateSaveButton));
    }

    render() {
        return (
            <MicroplanningComponent
                params={this.props.params}
                launchAlgo={algoParams => this.launchAlgo(algoParams)}
                selectItems={(items, activateSaveButton) => this.selectItems(items, activateSaveButton)}
                isAssignationLoading={this.state.isAssignationLoading}
                getAdditionalSelectData={() => this.getAdditionalSelectData()}
            />
        );
    }
}


MicroplanningContainer.propTypes = {
    dispatch: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
    fetchCurrentUserInfos: PropTypes.func.isRequired,
    fetchMutliRequests: PropTypes.func.isRequired,
    fetchRequest: PropTypes.func.isRequired,
    changeCluster: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
});

const MapDispatchToProps = dispatch => (
    {
        dispatch,
        changeCluster: withCluster => dispatch(mapActions.changeCluster(withCluster)),
        fetchCurrentUserInfos: () => dispatch(currentUserActions.fetchCurrentUserInfos(dispatch)),
        ...bindActionCreators({
            fetchMutliRequests,
            fetchRequest,
        }, dispatch),
    }
);


export default connect(MapStateToProps, MapDispatchToProps)(MicroplanningContainer);
