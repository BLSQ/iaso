/*
 * This component displays the coordinations list and teams list.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Grid from '@material-ui/core/Grid';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import Select from 'react-select';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
    setVillages, setTeams, setWorkzones,
} from '../redux/microplanning';
import { fetchRequest } from '../../../utils/requests';

import { getPossibleYears } from '../../../utils';
import { getUrl } from '../../../utils/routesUtils';
import { mapActions } from '../redux/map';
import { selectionActions } from '../redux/selection';
import { loadActions } from '../../../redux/load';

const MESSAGES = defineMessages({
    all: {
        defaultMessage: 'All',
        id: 'main.label.all',
    },
    allMale: {
        defaultMessage: 'All',
        id: 'main.label.allMale',
    },
    'years-select': {
        defaultMessage: 'Select years',
        id: 'microplanning.labels.years.select',
    },
});

class MicroplanningFilters extends Component {
    constructor(props) {
        super(props);
        this.state = {
            plannings: props.plannings,
            searchDisabled: false,
        };
        if (props.params.workzone_id) {
            this.props.changeCluster(false);
        }
    }

    componentDidMount() {
        const {
            params,
        } = this.props;
        if (params.planning_id) {
            this.onSearch();
        }
    }

    componentDidUpdate(prevProps) {
        const {
            params,
        } = this.props;
        if (params.coordination_id && prevProps.params.coordination_id !== params.coordination_id) {
            this.props.fetchRequest(
                `${getUrl('workzones', params)}${params.workzone_id ? '?with_areas=False' : ''}`,
                setWorkzones,
            );
            this.props.fetchRequest(getUrl('teams', params), setTeams);
        } else if (prevProps.params.workzone_id !== params.workzone_id) {
            this.props.fetchRequest(getUrl('teams', params), setTeams);
        }
    }

    onChangeHandler(key, value) {
        const {
            setCurrentTeam,
            dispatch,
            redirect,
            deselectAll,
            closeTooltip,
            params,
        } = this.props;
        const tempParams = {
            ...params,
            [key]: value,
        };
        if (key === 'planning_id') {
            delete tempParams.coordination_id;
            delete tempParams.workzone_id;
        }
        if (key === 'coordination_id') {
            delete tempParams.workzone_id;
        }
        delete tempParams.team_id;

        this.setState({
            ...this.state,
            searchDisabled: false,
        });
        setCurrentTeam(null);
        dispatch(selectionActions.resetAssignations());
        dispatch(setVillages(null));
        deselectAll();
        closeTooltip();
        redirect(tempParams);
    }

    onChangeTeam(teamId) {
        const {
            params,
            redirect,
            setCurrentTeam,
            dispatch,
        } = this.props;
        setCurrentTeam(teamId);
        if (teamId) {
            dispatch(loadActions.startLoading());
            dispatch(selectionActions.getTeamDetails(dispatch, teamId, params.planning_id, true));
        }
        redirect({
            ...params,
            team_id: teamId,
        });
    }

    onSearch() {
        const {
            getAdditionalSelectData,
            changeCluster,
            map: {
                withCluster,
            },
            params,
        } = this.props;
        const tempParams = {
            ...this.props.params,
        };
        this.setState({
            searchDisabled: true,
        });
        const url = getUrl('villages', tempParams);
        this.props.fetchRequest(url, setVillages).then(() => {
            if (params.workzone_id) {
                getAdditionalSelectData();
            }
            if (withCluster !== !tempParams.workzone_id) {
                changeCluster(!tempParams.workzone_id);
            }
        });
    }

    render() {
        const {
            intl: {
                formatMessage,
            },
            params,
            coordinations,
            workzones,
            teams,
            plannings,
            capacity,
        } = this.props;
        const {
            searchDisabled,
        } = this.state;

        const possibleYears = getPossibleYears();

        const currentPlanning = plannings.find(p => p.id === parseInt(params.planning_id, 10));
        return (
            <section>
                <div className="widget__container full">
                    <div className="widget__content">
                        <Grid container spacing={4}>
                            <Grid item xs={4}>
                                <div className="margin-bottom--tiny">
                                    <FormattedMessage id="microplanning.label.planning" defaultMessage="Planning: " />
                                </div>
                                {
                                    plannings.length > 0
                                    && (
                                        <Select
                                            simpleValue
                                            name="planning_id"
                                            value={parseInt(params.planning_id, 10)}
                                            placeholder={formatMessage(MESSAGES.allMale)}
                                            options={plannings.map(planning => ({ label: planning.name, value: planning.id }))}
                                            onChange={value => this.onChangeHandler('planning_id', value)}
                                        />
                                    )

                                }
                            </Grid>
                            <Grid item xs={4}>
                                <div className="margin-bottom--tiny">
                                    <FormattedMessage
                                        id="microplanning.filter.cases.date"
                                        defaultMessage="Highlight villages with last HAT case in years"
                                    />
                                </div>
                                <Select
                                    multi
                                    simpleValue
                                    autosize={false}
                                    name="years"
                                    value={params.years || ''}
                                    placeholder={formatMessage(MESSAGES['years-select'])}
                                    options={possibleYears.map(value => ({ label: value, value }))}
                                    onChange={value => this.onChangeHandler('years', value)}
                                />
                            </Grid>
                        </Grid>
                    </div>
                </div>
                {
                    params.planning_id && currentPlanning
                    && (
                        <div className="widget__container full">
                            <div className="widget__header">
                                <h2 className="widget__heading">
                                    <FormattedMessage id="microplanning.label.plannings" defaultMessage="Planning: " />
                                    {currentPlanning.name}
                                    {` (${currentPlanning.year})`}
                                </h2>
                            </div>
                            <div className="widget__content">
                                <Grid container spacing={4}>
                                    <Grid item xs={4}>
                                        <div className="margin-bottom--tiny">
                                            <FormattedMessage id="main.label.coordination" defaultMessage="Coordination" />
                                            {': '}
                                        </div>
                                        <Select
                                            simpleValue
                                            name="coordination_id"
                                            value={parseInt(params.coordination_id, 10)}
                                            placeholder={formatMessage(MESSAGES.all)}
                                            options={coordinations.map(coordination => ({ label: coordination.name, value: coordination.id }))}
                                            onChange={value => this.onChangeHandler('coordination_id', value)}
                                        />
                                    </Grid>
                                    <Grid item xs={4}>
                                        <div className="margin-bottom--tiny">
                                            <FormattedMessage id="main.label.workzone" defaultMessage="Work zone" />
                                            {': '}
                                        </div>

                                        <Select
                                            disabled={!params.coordination_id}
                                            simpleValue
                                            name="workzone_id"
                                            value={parseInt(params.workzone_id, 10)}
                                            placeholder={
                                                formatMessage(
                                                    {
                                                        id: 'main.label.workzone',
                                                        defaultMessage: 'Work zone',
                                                    },
                                                )
                                            }
                                            options={workzones.map(wz => ({ label: wz.name, value: wz.id }))}
                                            onChange={value => this.onChangeHandler('workzone_id', value)}
                                        />
                                    </Grid>
                                    <Grid item xs={4}>
                                        <div className="margin-bottom--tiny">
                                            <FormattedMessage id="microplanning.label.team" defaultMessage="Team" />
                                            {': '}
                                        </div>

                                        <Select
                                            disabled={!params.workzone_id}
                                            simpleValue
                                            name="team_id"
                                            value={parseInt(params.team_id, 10)}
                                            placeholder={`${formatMessage(MESSAGES.all)} - ${capacity}`}
                                            options={teams.map(team => ({ label: `${team.name} - ${team.capacity}`, value: team.id }))}
                                            onChange={teamId => this.onChangeTeam(teamId)}
                                        />
                                    </Grid>
                                </Grid>
                            </div>

                            <div className="widget__content align-right no-padding-top">
                                {
                                    !searchDisabled
                                    && (
                                        <div className="error-text margin-bottom">
                                            <FormattedMessage id="microplanning.error.refreshMap" defaultMessage="Click on search to refresh the map" />
                                        </div>
                                    )
                                }
                                <button
                                    disabled={searchDisabled}
                                    className="button"
                                    onClick={() => this.onSearch()}
                                >
                                    <FormattedMessage id="main.label.search" defaultMessage="Search" />
                                </button>
                            </div>
                        </div>
                    )
                }
            </section>
        );
    }
}
MicroplanningFilters.defaultProps = {
    params: null,
};
MicroplanningFilters.propTypes = {
    intl: PropTypes.object.isRequired,
    params: PropTypes.object,
    plannings: PropTypes.arrayOf(PropTypes.object).isRequired,
    coordinations: PropTypes.arrayOf(PropTypes.object).isRequired,
    teams: PropTypes.arrayOf(PropTypes.object).isRequired,
    workzones: PropTypes.arrayOf(PropTypes.object).isRequired,
    redirect: PropTypes.func.isRequired,
    deselectAll: PropTypes.func.isRequired,
    closeTooltip: PropTypes.func.isRequired,
    fetchRequest: PropTypes.func.isRequired,
    getAdditionalSelectData: PropTypes.func.isRequired,
    setCurrentTeam: PropTypes.func.isRequired,
    changeCluster: PropTypes.func.isRequired,
    map: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    capacity: PropTypes.number.isRequired,
};

const MapStateToProps = state => ({
    map: state.map,
    teams: state.microplanning.teamsList,
    plannings: state.microplanning.planningsList,
    workzones: state.microplanning.workZonesList,
    coordinations: state.microplanning.coordinationsList,
});

const MapDispatchToProps = dispatch => (
    {
        ...bindActionCreators({
            fetchRequest,
        }, dispatch),
        changeCluster: withCluster => dispatch(mapActions.changeCluster(withCluster)),
        dispatch,
    }
);

export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(MicroplanningFilters));
