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
import { push } from 'react-router-redux';

import { getUrl } from '../../utils/routesUtils';
import { launchAlgo, createUrl } from '../../utils/fetchData';
import MicroplanningComponent from './Microplanning';
import { selectionActions } from './redux/selection';
import { mapActions } from './redux/map';
import { currentUserActions } from '../../redux/currentUserReducer';
import { getYears } from '../../utils';
import {
    setCoordinations,
    setPlannings,
    setTeams,
    setWorkzones,
    setVillages,
    getAssignations,
} from './redux/microplanning';
import { fetchMutliRequests, fetchRequest } from '../../utils/requests';

const getBaseUrls = params => [
    {
        url: getUrl('coordinations', params),
        action: setCoordinations,
    },
    {
        url: getUrl('plannings', params),
        action: setPlannings,
    },
];

const getUrls = params => [
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
];

export class MicroplanningContainer extends Component {
    constructor(props) {
        super(props);
        this.currentParams = '';
        this.state = {
            isAssignationLoading: Boolean(props.params.workzone_id),
        };
    }

    componentDidMount() {
        const { params, redirect } = this.props;
        const newParams = { ...params };
        this.props.fetchMutliRequests(getBaseUrls(params)).then((res) => {
            const plannings = res[1];
            if (params.planning_id && !params.years) {
                const currentPlanning = plannings.find(p => p.id === parseInt(params.planning_id, 10));
                if (currentPlanning && currentPlanning.years_coverage) {
                    newParams.years = currentPlanning.years_coverage.join(',');
                } else {
                    newParams.years = getYears(3);
                }

                redirect(newParams);
                this.props.fetchMutliRequests(getUrls(newParams));
            }
            if (params.workzone_id) {
                this.getAdditionalSelectData();
            }
            this.props.changeCluster(!params.workzone_id);
        });
        this.props.fetchCurrentUserInfos();
    }

    componentDidUpdate(prevProps) {
        const {
            params,
            plannings,
            redirect,
        } = this.props;
        if (prevProps.params.planning_id !== params.planning_id && plannings.length > 0) {
            const currentPlanning = plannings.find(p => p.id === parseInt(params.planning_id, 10));
            let years = getYears(3);
            if (currentPlanning && currentPlanning.years_coverage) {
                years = currentPlanning.years_coverage.join(',');
            }
            redirect({
                ...params,
                years,
            });
        }
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
    redirect: PropTypes.func.isRequired,
    plannings: PropTypes.arrayOf(PropTypes.object).isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
    plannings: state.microplanning.planningsList,
});

const MapDispatchToProps = dispatch => (
    {
        dispatch,
        redirect: (params, baseUrl = 'micro') => dispatch(push(createUrl(params, baseUrl))),
        changeCluster: withCluster => dispatch(mapActions.changeCluster(withCluster)),
        fetchCurrentUserInfos: () => dispatch(currentUserActions.fetchCurrentUserInfos(dispatch)),
        ...bindActionCreators({
            fetchMutliRequests,
            fetchRequest,
        }, dispatch),
    }
);


export default connect(MapStateToProps, MapDispatchToProps)(MicroplanningContainer);
