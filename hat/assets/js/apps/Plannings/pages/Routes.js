import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import isEqual from 'lodash/isEqual';
import orderBy from 'lodash/orderBy';


import LoadingSpinner from '../../../components/loading-spinner';

import PlanningTeamSelection from '../components/PlanningTeamSelection';
import LayersComponent from '../../../components/LayersComponent';
import RouteSchedule from '../components/RouteSchedule';
import RouteMap from '../components/RouteMap';

import { createUrl, getRequest } from '../../../utils/fetchData';
import { teamActions } from '../redux/team';
import { clone } from '../../../utils';
import { getMonthName, hasSameVillageInAMonth, getMonthList } from '../utils/routeUtils';
import { warningSnackBar } from '../../../utils/constants/snackBars';
import { putRequest } from '../../../utils/requests';

import { enqueueSnackbar, closeFixedSnackbar } from '../../../redux/snackBarsReducer';
import { fetchPlannings } from '../redux/planning';
import { assignationActions } from '../redux/assignation';
import { mapActions } from '../redux/map';
import { saveAssignations } from '../redux/microplanning';

class Routes extends React.Component {
    constructor(props) {
        super(props);
        const selectedMonth = 1;
        this.state = {
            isModified: false,
            hasSplitError: false,
            selectedMonth,
            showSplitError: false,
            selectedAssignations: props.assignations.filter(a => a.month === selectedMonth),
            notSelectedAssignations: props.assignations.filter(a => a.month !== selectedMonth),
            monthList: [],
        };
    }

    componentDidMount() {
        fetchPlannings(this.props.dispatch).then(() => {
            this.setMonthList();
        });
        this.props.fetchTeams();
        if (this.props.params && (this.props.params.planning_id || this.props.params.team_id)) {
            this.props.fetchAssignations(this.props.params);
        }
    }

    componentDidUpdate(prevProps) {
        const {
            dispatch,
            modifiedAssignations,
        } = this.props;
        if ((prevProps.params.team_id !== this.props.params.team_id)
            || (prevProps.params.planning_id !== this.props.params.planning_id)) {
            this.props.fetchAssignations(this.props.params);
        }
        if (
            !isEqual(prevProps.assignations, this.props.assignations)
        ) {
            this.setAssignations(this.props.assignations);
        }
        if (
            prevProps.params.month_id !== this.props.params.month_id
        ) {
            this.setAssignations(modifiedAssignations || this.props.assignations);
        }
        if (
            prevProps.params.planning_id !== this.props.params.planning_id
        ) {
            this.setMonthList();
        }

        const {
            hasSplitError,
            showSplitError,
        } = this.state;
        if (hasSplitError && !showSplitError) {
            dispatch(enqueueSnackbar(warningSnackBar(
                'splitWarning',
                {
                    id: 'microplanning.route.splitError',
                    defaultMessage: 'A village is visited twice in a month',
                },
            )));
            this.setShowSplitError(true);
        }
        if (!hasSplitError && showSplitError) {
            dispatch(closeFixedSnackbar('splitWarning'));
            this.setShowSplitError(false);
        }
    }

    onSave() {
        const {
            dispatch,
            modifiedAssignations,
        } = this.props;

        this.props.putRequest(
            '/api/assignations/',
            modifiedAssignations,
            saveAssignations,
        ).then(() => {
            dispatch(closeFixedSnackbar('saveWarning'));
            this.setState({
                isModified: false,
            });

            this.props.fetchAssignations(this.props.params);
        });
    }

    setMonthList() {
        const {
            intl: {
                formatMessage,
            },
        } = this.props;

        const planningId = this.props.params.planning_id ? parseInt(this.props.params.planning_id, 10) : undefined;
        let currentPlanning;
        if (planningId) {
            currentPlanning = this.props.plannings.find(p => p.id === planningId);
        }
        const monthList = getMonthList(currentPlanning.months, currentPlanning.month_start, formatMessage);
        this.setState({
            monthList,
        });
    }


    setAssignations(
        assignations = this.props.assignations,
        selectedMonth = parseInt(this.props.params.month_id, 10),
    ) {
        this.setState({
            selectedMonth,
            selectedAssignations: assignations.filter(a => a.month === selectedMonth),
            notSelectedAssignations: assignations.filter(a => a.month !== selectedMonth),
        });
    }

    setShowSplitError(showSplitError) {
        this.setState({
            showSplitError,
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

    updateAssignation(monthId, monthlyAssignations) {
        const { assignations, setModifiedAssignations } = this.props;
        let modifiedAssignations = [];
        monthlyAssignations.forEach((month) => {
            month.data.forEach((a) => {
                const newAssignation = assignations.find(ass => ass.id === a.id);
                modifiedAssignations.push({
                    ...newAssignation,
                    month: month.id,
                    index: a.index,
                    split: a.split,
                    clone: a.clone,
                    population_split: a.population_split,
                    deleted: a.deleted,
                });
            });
        });
        modifiedAssignations = orderBy(modifiedAssignations, [item => item.index], ['asc']);
        this.setAssignations(modifiedAssignations, monthId);
        this.selectMonth(monthId);
        const {
            dispatch,
        } = this.props;
        if (!this.state.isModified) {
            dispatch(enqueueSnackbar(warningSnackBar(
                'saveWarning',
                {
                    id: 'microplanning.route.needToSave',
                    defaultMessage: 'Planning modified but not saved',
                },
            )));
        }
        setModifiedAssignations(modifiedAssignations);
        this.setState({
            isModified: true,
            hasSplitError: hasSameVillageInAMonth(modifiedAssignations),
        });
    }

    render() {
        const { baseLayer } = this.props.map;
        const { loading } = this.props.load;
        const teamId = this.props.params.team_id ? this.props.params.team_id : undefined;
        const { formatMessage } = this.props.intl;
        const {
            isModified,
            hasSplitError,
            monthList,
        } = this.state;
        return (
            <section className="route-container ">
                <div className="widget__container">
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <FormattedMessage id="microplanning.route.title" defaultMessage="Itineraries" />
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
                    teamId
                    && (
                        <div className="widget__container">
                            <div className="widget__content--tier">
                                <div className="map__option">
                                    <span className="map__option__header">
                                        <FormattedMessage id="microplanning.legend.key" defaultMessage="Legend" />
                                    </span>
                                    <form>
                                        <ul className="map__option__list legend">
                                            <li className="map__option__list__item">
                                                <i className="map__option__icon--route-with-positive-cases" />
                                                <FormattedMessage id="microplanning.legend.highlight" defaultMessage="Endemic villages" />
                                            </li>
                                            <li className="map__option__list__item">
                                                <i className="map__option__icon--route-assigned" />
                                                <FormattedMessage id="microplanning.legend.assigned" defaultMessage="Village(s) assigned to the month of" />
                                                <span className="month-name">{getMonthName(this.state.selectedMonth, monthList).toLowerCase()}</span>
                                            </li>
                                            <li className="map__option__list__item">
                                                <i className="map__option__icon--route-not-assigned" />
                                                <FormattedMessage id="microplanning.legend.notAssigned" defaultMessage="Village(s) not assinged to the month of" />
                                                <span className="month-name">{getMonthName(this.state.selectedMonth, monthList).toLowerCase()}</span>
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
                    )
                }
                <div className="widget__container">
                    <section>
                        <div className="widget__content--tier">
                            {
                                loading
                                && (
                                    <LoadingSpinner message={formatMessage({
                                        defaultMessage: 'Loading',
                                        id: 'main.label.loading',
                                    })}
                                    />
                                )
                            }
                            {
                                this.props.assignations.length > 0
                                && teamId
                                && (
                                    <RouteSchedule
                                        monthList={monthList}
                                        selectedMonth={this.state.selectedMonth}
                                        selectMonth={monthId => this.selectMonth(monthId)}
                                        load={this.props.load}
                                        assignations={this.props.modifiedAssignations || this.props.assignations}
                                        params={this.props.params}
                                        redirect={params => this.props.redirect(params)}
                                        updateAssignation={(month, assignations) => this.updateAssignation(month, assignations)}
                                    />
                                )
                            }
                            {
                                this.props.assignations.length === 0
                                && teamId
                                && (
                                    <div>
                                        <FormattedMessage id="table.noResult" defaultMessage="Aucun résultat" />
                                    </div>
                                )
                            }
                            {
                                teamId
                                && (
                                    <div className={`route-map ${this.props.assignations.length === 0 ? 'hidden' : ''}`}>
                                        <RouteMap
                                            baseLayer={baseLayer}
                                            overlays={{ labels: false }}
                                            villages={this.state.selectedAssignations}
                                            notSelectedVillages={this.state.notSelectedAssignations}
                                            getShape={type => this.props.getShape(type)}
                                        />
                                    </div>
                                )
                            }
                        </div>
                    </section>

                    <div className="align-right margin">
                        <button
                            disabled={!isModified || hasSplitError}
                            className="button"
                            onClick={() => this.onSave()}
                        >
                            <i className="fa fa-save" />
                            <FormattedMessage id="main.label.save" defaultMessage="Save" />
                        </button>

                    </div>
                </div>
            </section>
        );
    }
}

Routes.defaultProps = {
    plannings: [],
    teams: [],
    assignations: [],
    modifiedAssignations: null,
};

Routes.propTypes = {
    params: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    fetchTeams: PropTypes.func.isRequired,
    fetchAssignations: PropTypes.func.isRequired,
    redirect: PropTypes.func.isRequired,
    plannings: PropTypes.array,
    teams: PropTypes.array,
    assignations: PropTypes.array,
    getShape: PropTypes.func.isRequired,
    map: PropTypes.object.isRequired,
    changeLayer: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    putRequest: PropTypes.func.isRequired,
    setModifiedAssignations: PropTypes.func.isRequired,
    modifiedAssignations: PropTypes.any,
};

const RoutesIntl = injectIntl(Routes);

const MapStateToProps = state => ({
    load: state.load,
    infos: state.infos,
    plannings: state.plannings.list,
    teams: state.teams.list,
    assignations: state.assignations.list,
    map: state.map,
    modifiedAssignations: state.assignations.modifiedAssignations,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirect: params => dispatch(push(createUrl(params, 'routes'))),
    fetchAssignations: params => dispatch(assignationActions.fetchAssignations(params, dispatch, true)),
    setModifiedAssignations: assingations => dispatch(assignationActions.setModifiedAssignations(assingations)),
    fetchTeams: () => dispatch(teamActions.fetchTeams(dispatch)),
    getShape: url => getRequest(url, dispatch, null, false),
    changeLayer: (type, key) => dispatch(mapActions.changeLayer(type, key)),
    ...bindActionCreators({
        putRequest,
    }, dispatch),
});

export default connect(MapStateToProps, MapDispatchToProps)(RoutesIntl);
