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
import { deepEqual, clone } from '../../utils/index';
import { fetchUrls, launchAlgo } from '../../utils/fetchData';
import MicroplanningComponent from './Microplanning';
import { selectionActions } from './redux/selection';
import { currentUserActions } from '../../redux/currentUserReducer';

const request = require('superagent');

// This is where we configure the app data urls:
// the order is used in the success handler below
// the value for each key is some url, name and mock data.
// The name is used as the key in the results payload.
export const urls = workZonesWithAreas => (
    [
        {
            name: 'villagesMap',
            url: '/api/villages/',
            mock: [{
                AS: 'Muwanda-koso',
                confirmedCases: 1,
                lastConfirmedCase: '2016-06-27T13:29:03.141000Z',
                village: 'Polongo',
                ZS: 'Mosango',
            }, {
                AS: 'Fula',
                confirmedCases: 2,
                lastConfirmedCase: '2016-08-21T12:27:17.420000Z',
                village: 'Kikonzi-mf',
                ZS: 'Yasa Bonga',
            }],
        },
        {
            name: 'locations',
            url: '/api/zs/',
            mock: [
                [
                    1,
                    'Mosango',
                ],
                [
                    2,
                    'Yasa-bonga',
                ],
            ],
        },
        {
            name: 'coordinations',
            url: '/api/coordinations/',
            mock: [
                [
                    1,
                    'Mosango',
                ],
                [
                    2,
                    'Yasa-bonga',
                ],
            ],
        },
        {
            name: 'workzones',
            url: workZonesWithAreas ? '/api/workzones' : '/api/workzones/?with_areas=False',
            paramsToRemove: 'years',
            mock: [
            ],
        },
        {
            name: 'areas',
            url: '/api/as/',
            mock: [
                1,
                'Kinzamba Ii',
            ],
        },
        {
            name: 'plannings',
            url: '/api/plannings/',
            mock: [
                {
                    name: 'planning 2',
                    id: 2,
                },
                {
                    name: 'Test',
                    id: 1,
                },
            ],
        },
        {
            name: 'teams',
            url: '/api/teams/',
            mock: [
                [
                    2,
                    'qsdf',
                ],
                [
                    1,
                    'team 1',
                ],
            ],
        },
    ]
);

export class MicroplanningContainer extends Component {
    constructor(props) {
        super(props);
        this.currentParams = '';
        this.state = {
            isAssignationLoading: false,
        };
    }

    componentDidMount() {
        this.loadFullData(this.props.params);
        this.props.fetchCurrentUserInfos();
    }

    componentWillReceiveProps(newProps) {
        if (newProps.params.with_cluster === this.props.params.with_cluster) {
            this.loadFullData(newProps.params);
        }
    }

    getAdditionalSelectData(params = this.props.params) {
        const { dispatch } = this.props;
        const newParams = Object.assign({}, params);
        delete newParams.team_id;
        this.setState({
            isAssignationLoading: true,
        });
        if (!this.props.isTest) {
            request
                .get('/api/assignations/')
                .query(newParams)
                .then((result) => {
                    this.selectItems(result.body, false);
                    this.setState({
                        isAssignationLoading: false,
                    });
                })
                .catch((err) => {
                    console.error(err);
                    console.error('Error when fetching assignations details');
                    this.setState({
                        isAssignationLoading: false,
                    });
                });

            if (params.team_id) {
                dispatch(selectionActions.getTeamDetails(dispatch, params.team_id, params.planning_id));
            }
        }
    }

    loadFullData(params) {
        const { dispatch } = this.props;
        const oldParams = clone(this.currentParams);
        this.currentParams = clone(params);
        if (!deepEqual(oldParams, params, true)) {
            fetchUrls(urls(params.workzone_id), params, oldParams, dispatch).then(() => {
                if (params.planning_id && params.workzone_id) {
                    this.getAdditionalSelectData(params);
                }
            });
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
                isTest={this.props.isTest}
                params={this.props.params}
                launchAlgo={algoParams => this.launchAlgo(algoParams)}
                selectItems={(items, activateSaveButton) => this.selectItems(items, activateSaveButton)}
                isAssignationLoading={this.state.isAssignationLoading}
            />
        );
    }
}
MicroplanningContainer.defaultProps = {
    isTest: false,
};

MicroplanningContainer.propTypes = {
    dispatch: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
    isTest: PropTypes.bool,
    fetchCurrentUserInfos: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    fetchCurrentUserInfos: () => dispatch(currentUserActions.fetchCurrentUserInfos(dispatch)),
});

export default connect(MapStateToProps, MapDispatchToProps)(MicroplanningContainer);
