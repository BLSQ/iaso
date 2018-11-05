import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import LoadingSpinner from '../../../components/loading-spinner';

import PlanningTeamSelection from '../components/PlanningTeamSelection';
import WorkZonesSelect from '../components/WorkZonesSelect';
import MacroMap from '../components/MacroMap';
import { planningActions } from '../redux/planning';
import { createUrl, getRequest } from '../../../utils/fetchData';
import { coordinationActions } from '../redux/coordination';
import { getZsName, getWorkZoneName } from '../../../utils';
import AssingAsModale from '../components/AssingAsModale';


class Macroplanning extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            workzoneId: undefined,
            showModale: false,
        };
    }

    componentWillMount() {
        this.props.fetchPlannings();
        this.props.fetchCoordinations();
        if (this.props.params && (this.props.params.planning_id && this.props.params.coordination_id)) {
            this.props.fetchCoordinationsDetails(this.props.params.planning_id, this.props.params.coordination_id, this.props.params.as_id, this.props.params.years);
        }
    }

    componentWillReceiveProps(nextProps) {
        if ((((nextProps.params.coordination_id !== this.props.params.coordination_id)
            || (nextProps.params.planning_id !== this.props.params.planning_id)
            || (nextProps.params.years !== this.props.params.years)
        ) && nextProps.params.coordination_id)) {
            this.setState({
                showModale: false,
                workzoneId: undefined,
            });
            this.props.fetchCoordinationsDetails(nextProps.params.planning_id, nextProps.params.coordination_id, nextProps.params.as_id, nextProps.params.years);
        }
    }

    selectWorkZone(workzoneId) {
        const newWorkZoneId = workzoneId === this.state.workzoneId ? undefined : workzoneId;
        this.setState({
            workzoneId: newWorkZoneId,
        });
        this.props.selectArea(null);
        this.props.redirect({
            ...this.props.params,
            as_id: null,
        });
    }

    selectAs(currentAs) {
        if (this.state.workzoneId || currentAs.workzone) {
            this.props.selectArea(currentAs);
            this.setState({
                showModale: true,
            });
        }
    }

    closeModale() {
        this.props.selectArea(null);
        this.setState({
            showModale: false,
        });
    }


    assignToWorkZone(add, zs = null, as = this.props.currentArea.pk, workzoneId = null) {
        let currentWorkzoneId = workzoneId;
        if (!currentWorkzoneId) {
            currentWorkzoneId = add ? this.state.workzoneId : this.props.currentArea.workzoneId;
        }
        this.setState({
            showModale: false,
        });
        this.props.selectWorkzone(
            this.props.params.planning_id,
            this.props.params.coordination_id,
            currentWorkzoneId,
            as,
            zs,
            add ? 'add' : 'delete',
            this.props.params.years,
            this.props.currentCoordination,
        );
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
            currentWorkZones,
            currentCoordination,
            currentArea,
        } = this.props;
        const coordinationId = this.props.params.coordination_id ? this.props.params.coordination_id : undefined;
        return (
            <section className="macro-container">
                <div className="widget__container">
                    <div className="widget__header with-link">
                        <h2 className="widget__heading">
                            <FormattedMessage id="microplanning.macro.title" defaultMessage="Définir les rayons d'actions" />
                        </h2>
                        <a
                            href="/dashboard/management/workzones"
                        >
                            <FormattedMessage id="main.label.worzonesPage" defaultMessage="Gérer les rayons d'actions" />
                        </a>
                    </div>
                </div>
                <div className="widget__container route-legend">
                    <PlanningTeamSelection
                        plannings={this.props.plannings}
                        coordinations={this.props.coordinations}
                        params={this.props.params}
                        redirect={params => this.props.redirect(params)}
                        displayYearsSelect
                    />

                </div>
                {
                    coordinationId &&
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
                                        currentWorkZones && currentWorkZones.length === 0 && !loading &&
                                        <div className="bold-subtitle">
                                            <FormattedMessage id="microplanning.macro.nows" defaultMessage="Aucun rayon d'action pour cette coordination" />
                                        </div>
                                    }
                                    {
                                        currentWorkZones && currentWorkZones.length > 0 &&
                                        <div className="ws-select">
                                            <div className="bold-subtitle">
                                                1) <FormattedMessage id="microplanning.macro.selectWs" defaultMessage="Sélectionnez un rayon d'action" />
                                            </div>
                                            <div className="type-filters-containers">
                                                <WorkZonesSelect
                                                    currentCoordination={currentCoordination}
                                                    currentArea={currentArea}
                                                    workZones={currentWorkZones}
                                                    saveWorkZoneColor={(color, workZoneId) => this.props.saveWorkZoneColor(color, workZoneId, currentWorkZones, currentCoordination)}
                                                    selectedWorkZoneId={this.state.workzoneId}
                                                    selectWorkZone={workzoneId => this.selectWorkZone(workzoneId)}
                                                    assignToWorkZone={(action, zs, as, workZoneId) => this.assignToWorkZone(action, zs, as, workZoneId)}
                                                />
                                            </div>
                                        </div>
                                    }
                                </div>
                                {
                                    currentCoordination &&
                                    coordinationId &&
                                    <div className="map macro-map">
                                        <div className="as-select">
                                            {
                                                this.state.workzoneId &&
                                                <div className="bold-subtitle">
                                                    2) <FormattedMessage id="microplanning.macro.selectAs" defaultMessage="Sélectionnez une Aire de santé sur la carte" />
                                                </div>
                                            }
                                        </div>
                                        <MacroMap
                                            coordinationId={coordinationId}
                                            baseLayer={baseLayer}
                                            overlays={{ labels: false }}
                                            coordination={currentCoordination}
                                            workzones={currentWorkZones}
                                            selectAs={currentAs => this.selectAs(currentAs)}
                                        />
                                    </div>
                                }
                            </div>
                        </section>
                    </div>
                }
                <AssingAsModale
                    showModale={this.state.showModale}
                    closeModale={() => this.closeModale()}
                    area={currentArea || {}}
                    zoneName={currentArea && currentCoordination && currentCoordination.zones ? getZsName(currentArea ? currentArea.ZS : null, currentCoordination.zones.features) : ''}
                    workZone={
                        currentWorkZones && this.state.workzoneId ?
                            {
                                id: this.state.workzoneId,
                                name: getWorkZoneName(this.state.workzoneId, currentWorkZones),
                            } : {}
                    }
                    assignArea={add => this.assignToWorkZone(add)}
                    assignZone={add => this.assignToWorkZone(add, this.props.currentArea.ZS)}
                />
            </section>
        );
    }
}

Macroplanning.defaultProps = {
    plannings: [],
    coordinations: [],
    currentCoordination: {},
    currentWorkZones: [],
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
    map: PropTypes.object.isRequired,
    selectArea: PropTypes.func.isRequired,
    selectWorkzone: PropTypes.func.isRequired,
    saveWorkZoneColor: PropTypes.func.isRequired,
    currentWorkZones: PropTypes.array,
};

const MacroplanningIntl = injectIntl(Macroplanning);

const MapStateToProps = state => ({
    load: state.load,
    infos: state.infos,
    plannings: state.plannings.list,
    coordinations: state.coordinations.list,
    currentCoordination: state.coordinations.current,
    currentWorkZones: state.coordinations.workzones,
    currentArea: state.coordinations.currentArea,
    assignations: state.assignations.list,
    map: state.map,
});

const MapDispatchToProps = dispatch => ({
    redirect: params => dispatch(push(createUrl(params, 'macro'))),
    fetchCoordinationsDetails: (planningId, coordinationId, areaId, years) => dispatch(coordinationActions.fetchCoordinationsDetails(dispatch, planningId, coordinationId, areaId, years)),
    fetchPlannings: () => dispatch(planningActions.fetchPlannings(dispatch)),
    fetchCoordinations: () => dispatch(coordinationActions.fetchCoordinations(dispatch)),
    selectArea: area => dispatch(coordinationActions.selectArea(area)),
    selectWorkzone: (planningId, coordinationId, coordination, workzoneId, areaId, zoneId, action, years, currentCoordination) =>
        dispatch(coordinationActions.selectWorkzone(dispatch, planningId, coordinationId, coordination, workzoneId, areaId, zoneId, action, years, currentCoordination)),
    saveWorkZoneColor: (color, workzoneId, currentWorkZones) =>
        dispatch(coordinationActions.saveWorkZoneColor(dispatch, color, workzoneId, currentWorkZones)),
});

export default connect(MapStateToProps, MapDispatchToProps)(MacroplanningIntl);
