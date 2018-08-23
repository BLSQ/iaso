/*
 * The Microplanning component is responsible of the micro-planning process
 *
 * It has a few behaviors:
 * - load and filter data
 * - display the map
 * - execute the selection actions
 * - export to Excel the selected list
 * - print/export map view
 *
  */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import Select from 'react-select';
import ReactModal from 'react-modal';

import LoadingSpinner from '../../components/loading-spinner';
import { createUrl, getRequest } from '../../utils/fetchData';
import { saveTeamPlanning, saveCoordinationPlanning } from '../../utils/saveData';
import { getPossibleYears } from '../../utils';
import geoUtils from './utils/geo';
import { selectionActions, selectionModes } from './redux/selection';
import { mapActions } from './redux/map';
import {
    Map,
    MapLayers,
    MapLegend,
    MapSelectionControl,
    MapSelectionList,
    MapSelectionSummary,
    TeamSelectionTool,
} from './components';

const request = require('superagent');

const MESSAGES = defineMessages({
    'location-all': {
        defaultMessage: 'All',
        id: 'microplanning.labels.all',
    },
    'years-select': {
        defaultMessage: 'Select years',
        id: 'microplanning.labels.years.select',
    },
    loading: {
        defaultMessage: 'Chargement en cours',
        id: 'microplanning.labels.loading',
    },
});

export class Microplanning extends Component {
    constructor(props) {
        super(props);
        this.state = {
            locations: [],
            // selectedLocation: null,
            // isVillageListEdited: false,
            isSelectionModified: false,
            errorOnSave: undefined,
        };
    }

    componentWillReceiveProps(nextProps) {
        const { data, error, loading } = nextProps.load;
        const locations = ((data && data.locations) || []);
        // Remove geoscope from map if we remove a team
        if (!nextProps.params.team_id && nextProps.selection.showGeoScope) {
            this.props.toggleGeoScope(false);
        }
        // if we add a team, reset highlight buffer size
        if (nextProps.params.team_id && !this.props.params.team_id) {
            this.props.changeHighlightBufferSize(0);
        }
        this.setState({
            isSelectionModified: nextProps.selection.isSelectionModified || false,
            locations,
        });
    }
    onKeyDownHandler(event) {
        switch (event.keyCode) {
            case 27: { // `ESC`
                // deactivate fullscreen
                if (this.props.map.fullscreen) {
                    this.props.deactivateFullscreen();
                }
                break;
            }
            default:
                break;
        }
    }

    saveTeam() {
        if (this.props.params.team_id) {
            const tempVillages = this.props.selection.assignations
                .filter(v => v.team_id === parseInt(this.props.params.team_id, 10));
            this.setState({ isSavingTeam: true });
            saveTeamPlanning(
                tempVillages,
                parseInt(this.props.params.planning_id, 10),
                this.props.params.team_id,
            ).then((isSaved) => {
                this.setState({
                    isSavingTeam: false,
                    isSelectionModified: !isSaved,
                    errorOnSave: !isSaved,
                });
            });
        } else {
            this.setState({ isSavingTeam: true });
            saveCoordinationPlanning(
                this.props.selection.assignations,
                parseInt(this.props.params.planning_id, 10),
                this.props.params.coordination_id,
            ).then((isSaved) => {
                this.setState({
                    isSavingTeam: false,
                    isSelectionModified: !isSaved,
                    errorOnSave: !isSaved,
                });
            });
        }
    }

    // HANDLERS

    deSelectVillage(list) {
        // this.setState({
        //     isVillageListEdited: true,
        // });
        this.props.deselectItems(list);
    }

    changeSelectionModeHandler(mode) {
        if (this.props.selection.mode === mode) {
            // deactivate
            this.props.disableSelection();
        } else {
            this.props.changeMode(mode);
        }
    }

    activateFullscreenHandler() {
        // deactivate selection mode first
        this.props.disableSelection();
        // give focus to the map, otherwhise we need to click on the map to close it
        const planningMap = document.getElementById('planning-map').getElementsByClassName('map-container')[0];
        if (planningMap) {
            planningMap.focus();
        }
        this.props.activateFullscreen();
    }

    renderSaveTeamButton() {
        if (!this.props.params.coordination_id && !this.props.params.team_id) {
            return null;
        }
        return (
            <div>
                {
                    typeof this.state.errorOnSave !== 'undefined' ?
                        !this.state.errorOnSave ?
                            <div className="success"><FormattedMessage id="microplanning.label.save.success" defaultMessage="Selection saved" /></div> :
                            <div className="error"><FormattedMessage id="microplanning.label.save.error" defaultMessage="Error while saving" /></div>
                        : null
                }
                <button
                    className="button--save"
                    disabled={!this.state.isSelectionModified || this.state.isSavingTeam}
                    onClick={() => this.saveTeam()}
                >
                    {
                        this.state.isSavingTeam ? <i className="fa fa-spinner" /> : <i className="fa fa-save" />
                    }
                    <FormattedMessage id="microplanning.label.save" defaultMessage="Save Selection" />
                </button>
            </div>
        );
    }


    render() {
        const { formatMessage } = this.props.intl;
        // params filters & load status
        const {
            years, zs_id, as_id, planning_id, coordination_id,
        } = this.props.params;
        const { data, error, loading } = this.props.load;
        // possible years from 2000 to current year
        const possibleYears = getPossibleYears();
        const areas = ((data && data.areas) || []);
        let villages = [];
        const villagesMap = {};
        if (data && data.villagesMap) {
            for (const villageId of Object.keys(data.villagesMap)) {
                villagesMap[villageId] = geoUtils.extendVillageInfo(data.villagesMap[villageId]);
            }
            villages = Object.keys(villagesMap).map(key => villagesMap[key]);
        }
        const teams = ((data && data.teams) || []);
        const coordinations = ((data && data.coordinations) || []);
        const plannings = ((data && data.plannings) || []);
        const assignations = (this.props.selection.assignations) || [];
        const teamsMap = {};
        let capacity = 0;
        for (let i = 0; i < teams.length; i += 1) {
            const team = teams[i];
            teamsMap[team.id] = team;
            capacity += team.capacity;
        }

        if (this.props.params.team_id) {
            const team = teamsMap[this.props.params.team_id];
            if (team) {
                capacity = team.capacity; // eslint-disable-line
            }
        }

        const assignationsMap = {};
        for (let i = 0; i < assignations.length; i += 1) {
            const assignation = assignations[i];
            if (assignation.team_id !== -1) {
                assignationsMap[assignation.village_id] = assignation.team_id;
            }
        }
        const { selection } = this.props;

        let selectedVillages = [];
        const selectedAndUnselectedVillages = [];

        // planning selection
        // if a planning is selected we need to preselect the villages from the planning
        if (planning_id && data && data.villagesMap) {
            let assignationsTempList = assignations;

            if (this.props.params.team_id) {
                assignationsTempList = assignationsTempList.filter(x =>
                    x.team_id === parseInt(this.props.params.team_id, 10));
            }

            selectedVillages = assignationsTempList.filter(assignation =>
                (assignation.team_id !== -1 && assignation.village_id in villagesMap))
                .map(assignation => villagesMap[assignation.village_id]);
            assignationsTempList.map((assignation) => {
                if (villagesMap[assignation.village_id]) {
                    selectedAndUnselectedVillages.push(villagesMap[assignation.village_id]);
                }
                return true;
            });
        }

        // buffer sizes
        const bufferSize = (
            (selection.mode !== selectionModes.none)
                ? selection.bufferSize
                : 0);
        const { highlightBufferSize } = selection;

        // map
        const {
            baseLayer, overlays, legend, fullscreen,
        } = this.props.map;
        const mapClass = `map__panel${fullscreen ? '--fullscreen' : '--right'}`;
        const selectHighlightBuffer = () => {
            const inBuffer = geoUtils.villagesInHighlightBuffer(
                this.props.map.leafletMap,
                villages,
                selection.highlightBufferSize,
            );

            const algoParams = {
                village_id: inBuffer.map(x => x.id).join(','),
                coordination_id: this.props.params.coordination_id,
                years: this.props.params.years,
            };
            this.props.launchAlgo(algoParams);
        };
        return (
            <div
                tabIndex={0}
                role="button"
                onKeyDown={event => this.onKeyDownHandler(event)}
            >
                {
                    loading && <LoadingSpinner message={formatMessage(MESSAGES.loading)} />
                }

                {
                    error &&
                    <div className="widget__container">
                        <div className="widget__header">
                            <h2 className="widget__heading text--error">
                                <FormattedMessage id="microplanning.label.error" defaultMessage="Error:" />
                            </h2>
                        </div>
                        <div className="widget__content">
                            {error}
                        </div>
                    </div>
                }
                <TeamSelectionTool
                    params={this.props.params}
                    plannings={plannings}
                    coordinations={coordinations}
                    teams={teams}
                    redirect={params => this.props.redirect(params)}
                    deselectAll={() => this.props.deselectItems()}
                />
                <div className="widget__container">
                    <div className="widget__header">
                        {/* Map legend */}
                        <div className="map__header--legend">
                            <MapLegend isGeoScopeEnabled={this.props.selection.showGeoScope} />
                        </div>

                        {/* Param Filters */}
                        <div className="map__header--filters">
                            <div className="map__filters">
                                <div className="map__filters--option">
                                    <span className="map__text--select">
                                        <FormattedMessage
                                            id="microplanning.filter.zones"
                                            defaultMessage="Zones de santé"
                                        />
                                    </span>
                                    <Select
                                        multi
                                        simpleValue
                                        autosize={false}
                                        disabled={loading}
                                        name="zs_id"
                                        value={zs_id ? zs_id.split(',').map(zs => parseInt(zs, 10)) : ''}
                                        placeholder={formatMessage(MESSAGES['location-all'])}
                                        options={this.state.locations.map(zs =>
                                            ({ label: zs.name, value: zs.id }))}
                                        onChange={zsId =>
                                            this.props.redirect({
                                                ...this.props.params, zs_id: zsId,
                                            })}
                                    />
                                </div>

                                <div className="map__filters--option">
                                    <span className="map__text--select">
                                        <FormattedMessage
                                            id="microplanning.filter.area"
                                            defaultMessage="Aires de santé"
                                        />
                                    </span>
                                    <Select
                                        multi
                                        simpleValue
                                        autosize={false}
                                        disabled={loading}
                                        name="as_id"
                                        value={as_id ? as_id.split(',').map(zs => parseInt(zs, 10)) : ''}
                                        placeholder={formatMessage(MESSAGES['location-all'])}
                                        options={areas.map(as =>
                                            ({ label: as.name, value: as.id }))}
                                        onChange={asId =>
                                            this.props.redirect({
                                                ...this.props.params, as_id: asId,
                                            })}
                                    />
                                </div>

                                <div className="map__filters--option">
                                    <span className="map__text--select">
                                        <FormattedMessage
                                            id="microplanning.filter.cases.date"
                                            defaultMessage="Highlight villages with last HAT case in years"
                                        />
                                    </span>
                                    <Select
                                        multi
                                        simpleValue
                                        autosize={false}
                                        disabled={loading}
                                        name="years"
                                        value={years || ''}
                                        placeholder={formatMessage(MESSAGES['years-select'])}
                                        options={possibleYears.map(value =>
                                            ({ label: value, value }))}
                                        onChange={yearsList =>
                                            this.props.redirect({
                                                ...this.props.params,
                                                years: yearsList,
                                            })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Map layers */}
                        <div className="map__header--layers">
                            <MapLayers
                                base={baseLayer}
                                overlays={overlays}
                                toggleGeoScope={(toggle) => {
                                    this.props.disableSelection();
                                    this.props.toggleGeoScope(toggle);
                                }
                                }
                                change={(type, key) => this.props.changeLayer(type, key)}
                                showGeoScope={this.props.selection.showGeoScope}
                                teamId={this.props.params.team_id}
                            />
                        </div>
                    </div>
                    <div className="map__panel__container">
                        {!fullscreen &&
                            <div className="map__panel--left">
                                <div className="map__selection">
                                    <div className="map__selection__top">
                                        <div className="map__selection__title">
                                            <FormattedMessage id="microplanning.label.selection" defaultMessage="Village selection" />
                                        </div>

                                        {/* Selection actions */}
                                        <MapSelectionControl
                                            mode={selection.mode}
                                            teamId={this.props.params.team_id}
                                            coordinationId={this.props.params.coordination_id}
                                            changeMode={mode => this.changeSelectionModeHandler(mode)}
                                            bufferSize={selection.bufferSize}
                                            changeBufferSize={event =>
                                                this.props.changeBufferSize(event)}
                                            highlightBufferSize={selection.highlightBufferSize}
                                            changeHighlightBufferSize={event =>
                                                this.props
                                                    .changeHighlightBufferSize(event.target.value)}
                                            selectHighlightBuffer={selectHighlightBuffer}
                                            isGeoScopeEnabled={this.props.selection.showGeoScope}
                                        />

                                        {/* Selected summary */}
                                        <MapSelectionSummary
                                            data={selectedAndUnselectedVillages}
                                            assignationsMap={assignationsMap}
                                            capacity={capacity}
                                        />
                                    </div>

                                    <div className="map__selection__middle">
                                        {/* Selected list */}
                                        <MapSelectionList
                                            data={selectedAndUnselectedVillages}
                                            show={item => this.props.displayItem(item)}
                                            deselect={list => this.deSelectVillage(list)}
                                            assignationsMap={assignationsMap}
                                            teamsMap={teamsMap}
                                        />
                                    </div>

                                    <div className="map__selection__bottom">
                                        {/* actions */}
                                        {this.renderSaveTeamButton()}
                                        <button className="button--print middle" onClick={() => this.activateFullscreenHandler()}>
                                            <i className="fa fa-print" />
                                            <FormattedMessage id="microplanning.label.print" defaultMessage="Print map" />
                                        </button>
                                        <button className="button--print" onClick={() => window.open(`/dashboard/csvexport/${this.props.params.planning_id}/`, '_self')}>
                                            <i className="fa fa-file-excel-o" />
                                            <FormattedMessage id="microplanning.label.csv" defaultMessage="Télécharger en Excel" />
                                        </button>
                                    </div>

                                </div>
                            </div>
                        }
                        {/* Map */}
                        <div className={mapClass} id="planning-map">
                            {
                                !this.props.isTest &&
                                <Map
                                    teams={teams}
                                    teamId={this.props.params.team_id}
                                    planningId={this.props.params.planning_id}
                                    baseLayer={baseLayer}
                                    overlays={overlays}
                                    legend={legend}
                                    fullscreen={fullscreen}
                                    items={villages}
                                    assignationsMap={assignationsMap}
                                    selectedItems={selectedVillages}
                                    bufferSize={bufferSize}
                                    highlightBufferSize={highlightBufferSize}
                                    deselectItems
                                    selectionAction={list => this.props.executeSelectionAction(list)}
                                    selectItems={(list, activateSaveButton) =>
                                        this.props.selectItems(list, activateSaveButton)}
                                    chosenItem={selection.displayedItem}
                                    showItem={item => this.props.displayItem(item)}
                                    leafletMap={map => this.props.setLeafletMap(map)}
                                    geoScope={this.props.selection.geoScope}
                                    showGeoScope={this.props.selection.showGeoScope}
                                    updateGeoScope={geoScope => this.props.updateGeoScope(geoScope)}
                                    getShape={type => this.props.getShape(type)}
                                />
                            }
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
Microplanning.defaultProps = {
    isTest: false,
};

Microplanning.propTypes = {
    changeBufferSize: PropTypes.func.isRequired,
    changeHighlightBufferSize: PropTypes.func.isRequired,
    executeSelectionAction: PropTypes.func.isRequired,
    deselectItems: PropTypes.func.isRequired,
    selectItems: PropTypes.func.isRequired,
    displayItem: PropTypes.func.isRequired,
    toggleLegend: PropTypes.func.isRequired,
    changeLayer: PropTypes.func.isRequired,
    setLeafletMap: PropTypes.func.isRequired,
    disableSelection: PropTypes.func.isRequired,
    activateFullscreen: PropTypes.func.isRequired,
    deactivateFullscreen: PropTypes.func.isRequired,
    changeMode: PropTypes.func.isRequired,
    redirect: PropTypes.func.isRequired,
    launchAlgo: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
    selection: PropTypes.object.isRequired,
    updateGeoScope: PropTypes.func.isRequired,
    getShape: PropTypes.func.isRequired,
    map: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    toggleGeoScope: PropTypes.func.isRequired,
    isTest: PropTypes.bool,
};

const MicroplanningWithIntl = injectIntl(Microplanning);

function getShapePath(type) {
    if (type === 'area') { return AREAS_PATH; }
    if (type === 'zone') { return ZONES_PATH; }
    return null;
}

const MapDispatchToProps = dispatch => ({
    changeBufferSize: event => dispatch(selectionActions.changeBufferSize(event.target.value)),
    changeHighlightBufferSize: value => dispatch(selectionActions.changeHighlightBufferSize(value)),
    toggleGeoScope: toggle => dispatch(selectionActions.toggleGeoScope(toggle)),
    updateGeoScope: geoScope => dispatch(selectionActions.updateGeoScope(geoScope)),
    executeSelectionAction: list => dispatch(selectionActions.executeSelection(list)),
    deselectItems: (list, activateSaveButton) =>
        dispatch(selectionActions.deselectItems(list, activateSaveButton)),
    selectItems: (list, activateSaveButton) =>
        dispatch(selectionActions.selectItems(list, activateSaveButton)),
    displayItem: item => dispatch(selectionActions.displayItem(item)),
    toggleLegend: legend => dispatch(mapActions.toggleLegend(legend)),
    changeLayer: (type, key) => dispatch(mapActions.changeLayer(type, key)),
    setLeafletMap: map => dispatch(mapActions.setLeafletMap(map)),
    disableSelection: () => dispatch(selectionActions.disableSelection()),
    activateFullscreen: () => dispatch(mapActions.activateFullscreen()),
    deactivateFullscreen: () => dispatch(mapActions.deactivateFullscreen()),
    changeMode: mode => dispatch(selectionActions.changeMode(mode)),
    redirect: params => dispatch(push(createUrl(params, 'micro'))),
    getShape: type => getRequest(getShapePath(type), dispatch),
});

const MapStateToProps = state => ({
    config: state.config,
    load: state.load,
    selection: state.selection,
    map: state.map,
});


export default connect(MapStateToProps, MapDispatchToProps)(MicroplanningWithIntl);
