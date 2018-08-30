import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import Select from 'react-select';

import LoadingSpinner from '../../../components/loading-spinner';

import PlanningTeamSelection from '../components/PlanningTeamSelection';
import MacroMap from '../components/MacroMap';
import { planningActions } from '../redux/planning';
import { createUrl, getRequest } from '../../../utils/fetchData';
import { coordinationActions } from '../redux/coordination';
import { clone, formatThousand } from '../../../utils';
import { mapActions } from '../redux/map';


const MESSAGES = defineMessages({
    none: {
        defaultMessage: 'Aucun',
        id: 'macroplanning.none',
    },
    capacity: {
        defaultMessage: 'capacité',
        id: 'macroplanning.capacity',
    },
    population: {
        defaultMessage: 'population',
        id: 'macroplanning.population',
    },
});

const workzoneLabel = (workzone, formatMessage) => (
    <span>
        {workzone.name}
        <span className="Select-infos">
            ({formatMessage(MESSAGES.capacity)} {formatThousand(workzone.total_capacity)} / {formatMessage(MESSAGES.population)} {formatThousand(workzone.population_endemic_villages)})
        </span>
    </span>
);

const getWorkZoneName = (workzoneId, workzones) => {
    if (workzoneId) {
        return (workzones.filter(w => w.id === workzoneId)[0].name);
    }
    return '';
};

const getZsName = (zoneId, zones) => {
    if (zoneId) {
        return (zones.filter(z => parseInt(z.properties.pk, 10) === zoneId)[0].properties.name);
    }
    return '';
};

class Macroplanning extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            workzoneId: undefined,
        };
    }

    componentWillMount() {
        this.props.fetchPlannings();
        this.props.fetchCoordinations();
        if (this.props.params && (this.props.params.planning_id && this.props.params.coordination_id)) {
            this.props.fetchCoordinationsDetails(this.props.params.planning_id, this.props.params.coordination_id, this.props.params.as_id);
        }
    }

    componentWillReceiveProps(nextProps) {
        if ((((nextProps.params.coordination_id !== this.props.params.coordination_id)
            || (nextProps.params.planning_id !== this.props.params.planning_id)
        ) && nextProps.params.coordination_id)) {
            this.props.fetchCoordinationsDetails(nextProps.params.planning_id, nextProps.params.coordination_id, nextProps.params.as_id);
        }
        if (this.props.currentArea) {
            this.setState({
                workzoneId: this.props.currentArea.workzoneId ? this.props.currentArea.workzoneId : undefined,
            });
        }
    }

    selectMonth(monthId) {
        const tempParams = clone(this.props.params);
        delete tempParams.month_id;
        this.props.redirect({
            ...tempParams,
            month_id: monthId,
        });
    }

    selectAs(currentAs) {
        this.props.selectArea(currentAs);
        this.setState({
            workzoneId: currentAs.workzoneId ? currentAs.workzoneId : undefined,
        });
        this.props.redirect({
            ...this.props.params,
            as_id: currentAs.pk,
        });
    }


    assignArea() {
        if (this.state.workzoneId) {
            this.props.selectWorkzone(this.props.params.planning_id, this.props.params.coordination_id, this.state.workzoneId, this.props.currentArea.pk, null, 'add');
        } else {
            this.props.selectWorkzone(this.props.params.planning_id, this.props.params.coordination_id, this.props.currentArea.workzoneId, this.props.currentArea.pk, null, 'delete');
        }
    }

    assignZone() {
        if (this.state.workzoneId) {
            this.props.selectWorkzone(this.props.params.planning_id, this.props.params.coordination_id, this.state.workzoneId, this.props.currentArea.pk, this.props.currentArea.ZS, 'add');
        } else {
            this.props.selectWorkzone(this.props.params.planning_id, this.props.params.coordination_id, this.props.currentArea.workzoneId, this.props.currentArea.pk, this.props.currentArea.ZS, 'delete');
        }
    }

    render() {
        const {
            intl: {
                formatMessage,
            },
            map: {
                baseLayer,
            },
            load: {
                loading,
            },
            currentCoordination,
            currentArea,
        } = this.props;
        const coordinationId = this.props.params.coordination_id ? this.props.params.coordination_id : undefined;
        return (
            <section className="macro-container">
                <div className="widget__container">
                    <div className="widget__header with-link">
                        <h2 className="widget__heading">
                            <FormattedMessage id="microplanning.macro.title" defaultMessage="Assigner les champs d'actions" />
                        </h2>
                        <a
                            href="/dashboard/management/workzones"
                        >
                            <FormattedMessage id="main.label.worzonesPage" defaultMessage="Gérer les champs d'actions" />
                        </a>
                    </div>
                </div>
                <div className="widget__container route-legend">
                    <PlanningTeamSelection
                        plannings={this.props.plannings}
                        coordinations={this.props.coordinations}
                        params={this.props.params}
                        redirect={params => this.props.redirect(params)}
                    />

                </div>
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
                            <div>
                                {
                                    !currentArea && !loading &&
                                    <div>
                                        <FormattedMessage id="microplanning.macro.selectAs" defaultMessage="Sélectionnez une Aire de santé sur la carte" />
                                    </div>
                                }
                                {
                                    (currentArea || loading) &&
                                    <section>
                                        <div className="sub-title">
                                            <FormattedMessage id="microplanning.macro.selectedAs" defaultMessage="Aire de santé sélectionnée" />:
                                            {' '}
                                            {currentArea && <b>{currentArea.name}</b>}
                                        </div>
                                        <FormattedMessage id="microplanning.label.workzone" defaultMessage="Champ d'action" />
                                        <Select
                                            simpleValue
                                            name="workzone_id"
                                            value={this.state.workzoneId}
                                            placeholder={formatMessage(MESSAGES.none)}
                                            options={currentCoordination.workzones.map(w =>
                                                ({ label: workzoneLabel(w, formatMessage), value: w.id }))}
                                            onChange={event =>
                                                this.setState({
                                                    workzoneId: event || undefined,
                                                })}
                                        />
                                        {
                                            currentArea &&
                                            (this.state.workzoneId !== currentArea.workzoneId) &&
                                            <section className="widget__content align-right no-padding-right ">
                                                <div>
                                                    <button
                                                        className="button"
                                                        onClick={() => this.assignArea()}
                                                    >
                                                        {
                                                            this.state.workzoneId &&
                                                            <span>
                                                                <FormattedMessage
                                                                    id="macroplanning.label.assignAs"
                                                                    defaultMessage="Assigner l'AS {asName} à"
                                                                    values={{ asName: currentArea.name }}
                                                                />
                                                                {' '}   {getWorkZoneName(this.state.workzoneId, currentCoordination.workzones)}
                                                            </span>
                                                        }
                                                        {
                                                            !this.state.workzoneId &&
                                                            <span>
                                                                <FormattedMessage
                                                                    id="macroplanning.label.unAssignAs"
                                                                    defaultMessage="Enlever l'AS {asName} de"
                                                                    values={{ asName: currentArea.name }}
                                                                />
                                                                {' '}  {currentArea.workzone}
                                                            </span>
                                                        }
                                                    </button>
                                                </div>
                                                <div className="padding-top">
                                                    <button
                                                        className="button"
                                                        onClick={() => this.assignZone()}
                                                    >
                                                        {
                                                            this.state.workzoneId &&
                                                            <span>
                                                                <FormattedMessage
                                                                    id="macroplanning.label.assignZs"
                                                                    defaultMessage="Assigner la ZS {zsName} à"
                                                                    values={{ zsName: getZsName(currentArea.ZS, currentCoordination.current.zones.features) }}
                                                                />
                                                                {' '}   {getWorkZoneName(this.state.workzoneId, currentCoordination.workzones)}
                                                            </span>
                                                        }
                                                        {
                                                            !this.state.workzoneId &&
                                                            <span>
                                                                <FormattedMessage
                                                                    id="macroplanning.label.unAssignZs"
                                                                    defaultMessage="Enlever la ZS {zsName} de"
                                                                    values={{ zsName: getZsName(currentArea.ZS, currentCoordination.current.zones.features) }}
                                                                />
                                                                {' '}  {currentArea.workzone}
                                                            </span>
                                                        }
                                                    </button>
                                                </div>
                                            </section>
                                        }
                                    </section>
                                }
                                <div className="type-filters-containers">
                                    <span className="locator-subtitle">
                                        <FormattedMessage id="macroplanning.legend.title" defaultMessage="Légende" />
                                    </span>
                                    <ul>
                                        <li
                                            className="not-assigned"
                                        >
                                            <FormattedMessage id="macroplanning.legend.notAssigned" defaultMessage="Aucun champ d'action appliqué" />
                                        </li>
                                        <li
                                            className="notFull"
                                        >
                                            <FormattedMessage id="macroplanning.legend.notFull" defaultMessage="Capacité des équipes < population villages" />
                                        </li>
                                        <li
                                            className="full"
                                        >
                                            <FormattedMessage id="macroplanning.legend.full" defaultMessage="Capacité des équipes > population villages" />
                                        </li>
                                        <li
                                            className="hover"
                                        >
                                            <FormattedMessage id="macroplanning.legend.hover" defaultMessage="Champs d'action" />
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            {
                                currentCoordination &&
                                coordinationId &&
                                <div className="map">
                                    <MacroMap
                                        baseLayer={baseLayer}
                                        overlays={{ labels: false }}
                                        coordination={currentCoordination}
                                        currentArea={currentArea}
                                        getShape={type => this.props.getShape(type)}
                                        selectAs={currentAs => this.selectAs(currentAs)}
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

Macroplanning.defaultProps = {
    plannings: [],
    coordinations: [],
    currentCoordination: {},
    currentArea: null,
};

Macroplanning.propTypes = {
    params: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    fetchPlannings: PropTypes.func.isRequired,
    fetchCoordinations: PropTypes.func.isRequired,
    fetchCoordinationsDetails: PropTypes.func.isRequired,
    redirect: PropTypes.func.isRequired,
    plannings: PropTypes.array,
    coordinations: PropTypes.array,
    currentCoordination: PropTypes.object,
    currentArea: PropTypes.object,
    getShape: PropTypes.func.isRequired,
    map: PropTypes.object.isRequired,
    selectArea: PropTypes.func.isRequired,
    selectWorkzone: PropTypes.func.isRequired,
};

const MacroplanningIntl = injectIntl(Macroplanning);

const MapStateToProps = state => ({
    load: state.load,
    infos: state.infos,
    plannings: state.plannings.list,
    coordinations: state.coordinations.list,
    currentCoordination: state.coordinations.current,
    currentArea: state.coordinations.currentArea,
    assignations: state.assignations.list,
    map: state.map,
});

const MapDispatchToProps = dispatch => ({
    redirect: params => dispatch(push(createUrl(params, 'macro'))),
    fetchCoordinationsDetails: (planningId, coordinationId, areaId) => dispatch(coordinationActions.fetchCoordinationsDetails(dispatch, planningId, coordinationId, areaId)),
    fetchPlannings: () => dispatch(planningActions.fetchPlannings(dispatch)),
    fetchCoordinations: () => dispatch(coordinationActions.fetchCoordinations(dispatch)),
    selectArea: area => dispatch(coordinationActions.selectArea(area)),
    getShape: type => getRequest(`/static/json/${type}s.json`, dispatch),
    selectWorkzone: (planningId, coordinationId, coordination, workzoneId, areaId, zoneId, action) => dispatch(coordinationActions.selectWorkzone(dispatch, planningId, coordinationId, coordination, workzoneId, areaId, zoneId, action)),
});

export default connect(MapStateToProps, MapDispatchToProps)(MacroplanningIntl);
