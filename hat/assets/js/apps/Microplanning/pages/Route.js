import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import LoadingSpinner from '../../../components/loading-spinner';

import PlanningTeamSelection from '../components/PlanningTeamSelection';
import LayersComponent from '../../../components/LayersComponent';
import RouteSchedule from '../components/RouteSchedule';
import RouteMap from '../components/RouteMap';
import { planningActions } from '../redux/planning';
import { assignationActions } from '../redux/assignation';
import { createUrl, getRequest } from '../../../utils/fetchData';
import { teamActions } from '../redux/team';
import { clone } from '../../../utils';
import { mapActions } from '../redux/map';
import { getMonthName } from '../utils/routeUtils';

class Routes extends React.Component {
    constructor(props) {
        super(props);
        const selectedMonth = 1;
        this.state = {
            selectedMonth,
            selectedAssignations: props.assignations.filter(a => a.month === selectedMonth),
            notSelectedAssignations: props.assignations.filter(a => a.month !== selectedMonth),
        };
    }

    componentWillMount() {
        this.props.fetchPlannings();
        this.props.fetchTeams();
        if (this.props.params && (this.props.params.planning_id || this.props.params.team_id)) {
            this.props.fetchAssignations(this.props.params);
        }
    }

    componentWillReceiveProps(nextProps) {
        if ((nextProps.params.team_id !== this.props.params.team_id)
            || (nextProps.params.planning_id !== this.props.params.planning_id)) {
            this.props.fetchAssignations(nextProps.params);
        }
        const selectedMonth = parseInt(nextProps.params.month_id, 10);
        this.setState({
            selectedMonth,
            selectedAssignations: nextProps.assignations.filter(a => a.month === selectedMonth),
            notSelectedAssignations: nextProps.assignations.filter(a => a.month !== selectedMonth),
        });
    }

    selectMonth(monthId) {
        const tempParams = clone(this.props.params);
        delete tempParams.month_id;
        this.props.redirect({
            ...tempParams,
            month_id: monthId,
        });
    }

    updateAssignation(index, month, assignationId) {
        this.selectMonth(month);
        this.props.updateAssignation(index, month, assignationId);
    }

    render() {
        const { baseLayer } = this.props.map;
        const { loading } = this.props.load;
        const teamId = this.props.params.team_id ? this.props.params.team_id : undefined;
        const { formatMessage } = this.props.intl;
        return (
            <section className="route-container ">
                <div className="widget__container">
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <FormattedMessage id="microplanning.route.title" defaultMessage="Itinéraires" />
                        </h2>
                    </div>
                </div>
                <div className="widget__container route-legend">
                    <PlanningTeamSelection
                        plannings={this.props.plannings}
                        teams={this.props.teams}
                        params={this.props.params}
                        redirect={params => this.props.redirect(params)}
                    />

                </div>


                {
                    teamId &&
                    <div className="widget__container">
                        <div className="widget__content--tier">
                            <div className="map__option">
                                <span className="map__option__header">
                                    <FormattedMessage id="microplanning.legend.key" defaultMessage="Légende" />
                                </span>
                                <form>
                                    <ul className="map__option__list legend">
                                        <li className="map__option__list__item">
                                            <i className="map__option__icon--route-with-positive-cases" />
                                            <FormattedMessage id="microplanning.legend.highlight" defaultMessage="Villages endémiques" />
                                        </li>
                                        <li className="map__option__list__item">
                                            <i className="map__option__icon--route-assigned" />
                                            <FormattedMessage id="microplanning.legend.assigned" defaultMessage="Village(s) assigné(s) au mois de" />
                                            <span className="month-name">{getMonthName(this.state.selectedMonth).toLowerCase()}</span>
                                        </li>
                                        <li className="map__option__list__item">
                                            <i className="map__option__icon--route-not-assigned" />
                                            <FormattedMessage id="microplanning.legend.notAssigned" defaultMessage="Village(s) non assigné(s) au mois de" />
                                            <span className="month-name">{getMonthName(this.state.selectedMonth).toLowerCase()}</span>
                                        </li>
                                    </ul>
                                </form>
                            </div>
                            <div>
                                <LayersComponent
                                    base={baseLayer}
                                    change={(type, key) => this.props.changeLayer(type, key)}
                                />
                            </div>
                        </div>
                    </div>
                }
                <div className="widget__container">
                    <section>
                        <div className="widget__content--tier">
                            {
                                loading &&
                                <LoadingSpinner message={formatMessage({
                                    defaultMessage: 'Chargement en cours',
                                    id: 'microplanning.labels.loading',
                                })}
                                />
                            }
                            {
                                this.props.assignations.length > 0 &&
                                teamId &&
                                <RouteSchedule
                                    selectedMonth={this.state.selectedMonth}
                                    selectMonth={monthId => this.selectMonth(monthId)}
                                    load={this.props.load}
                                    assignations={this.props.assignations}
                                    params={this.props.params}
                                    redirect={params => this.props.redirect(params)}
                                    updateAssignation={(index, month, assignationId) => this.updateAssignation(index, month, assignationId)}
                                />
                            }
                            {
                                this.props.assignations.length === 0 &&
                                teamId &&
                                <div>
                                    <FormattedMessage id="table.noResult" defaultMessage="Aucun résultat" />
                                </div>
                            }
                            {
                                teamId &&
                                <div className={`route-map ${this.props.assignations.length === 0 ? 'hidden' : ''}`}>
                                    <RouteMap
                                        baseLayer={baseLayer}
                                        overlays={{ labels: false }}
                                        villages={this.state.selectedAssignations}
                                        notSelectedVillages={this.state.notSelectedAssignations}
                                        getShape={type => this.props.getShape(type)}
                                    />
                                </div>
                            }
                        </div>
                    </section>
                </div>
            </section>
        );
    }
}

Routes.defaultProps = {
    plannings: [],
    teams: [],
    assignations: [],
};

Routes.propTypes = {
    params: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    fetchPlannings: PropTypes.func.isRequired,
    fetchTeams: PropTypes.func.isRequired,
    fetchAssignations: PropTypes.func.isRequired,
    updateAssignation: PropTypes.func.isRequired,
    redirect: PropTypes.func.isRequired,
    plannings: PropTypes.array,
    teams: PropTypes.array,
    assignations: PropTypes.array,
    getShape: PropTypes.func.isRequired,
    map: PropTypes.object.isRequired,
    changeLayer: PropTypes.func.isRequired,
};

const RoutesIntl = injectIntl(Routes);

const MapStateToProps = state => ({
    load: state.load,
    infos: state.infos,
    plannings: state.plannings.list,
    teams: state.teams.list,
    assignations: state.assignations.list,
    map: state.map,
});

const MapDispatchToProps = dispatch => ({
    redirect: params => dispatch(push(createUrl(params, 'routes'))),
    fetchAssignations: params => dispatch(assignationActions.fetchAssignations(params, dispatch)),
    fetchPlannings: () => dispatch(planningActions.fetchPlannings(dispatch)),
    fetchTeams: () => dispatch(teamActions.fetchTeams(dispatch)),
    updateAssignation: (index, month, assignationId) => dispatch(assignationActions.updateAssignation(index, month, assignationId, dispatch)),
    getShape: type => getRequest(`/static/json/${type}s.json`, dispatch),
    changeLayer: (type, key) => dispatch(mapActions.changeLayer(type, key)),
});

export default connect(MapStateToProps, MapDispatchToProps)(RoutesIntl);
