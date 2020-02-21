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

import LoadingSpinner from '../../components/loading-spinner';
import TabsComponent from '../../components/TabsComponent';
import GeoScope from './components/GeoScope';
import { createUrl, getRequest } from '../../utils/fetchData';
import { saveCoordinationPlanning, saveWorkzonePlanning } from '../../utils/saveData';
import { getPossibleYears } from '../../utils';
import geoUtils from '../../utils/geo';
import { selectionActions } from './redux/selection';
import { mapActions } from './redux/map';
import { villageSelectionLegend } from './constants/microplanningLegends';
import MicroplanningVillageSearch from './components/MicroplanningVillageSearch';

import {
    Map,
    MapLayers,
    MapLegend,
    MapSelectionControl,
    MapSelectionList,
    MapSelectionSummary,
    TeamSelectionTool,
} from './components';
import DownloadButtonsComponent from '../../components/DownloadButtonsComponent';

let timerMsg;

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
        defaultMessage: 'Loading',
        id: 'main.label.loading',
    },
    villageSelection: {
        defaultMessage: 'Villages selection',
        id: 'microplanning.labels.villageSelection',
    },
    geoScope: {
        defaultMessage: 'Geographical scope',
        id: 'microplanning.labels.geoScope',
    },
    cluster_title: {
        defaultMessage: 'Village clustering',
        id: 'microplanning.labels.cluster_title',
    },
});

export class Microplanning extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isSelectionModified: false,
            errorOnSave: undefined,
            currentTab: 'villageSelection',
            showSearchModal: false,
        };
        if (props.params.workzone_id) {
            this.props.changeCluster(false);
        }
    }

    componentWillReceiveProps(nextProps) {
        // if we add a team, reset highlight buffer size
        if (nextProps.params.team_id && !this.props.params.team_id) {
            this.props.changeHighlightBufferSize(0);
        }
        if (nextProps.params.workzone_id && !this.props.params.workzone_id) {
            this.props.changeCluster(false);
        }
        if (!nextProps.params.workzone_id && this.props.params.workzone_id) {
            this.props.changeCluster(true);
        }
        this.setState({
            isSelectionModified: nextProps.selection.isSelectionModified || false,
            currentTab: !nextProps.params.team_id ? 'villageSelection' : this.state.currentTab,
        });
    }

    componentWillUnmount() {
        if (timerMsg) {
            clearTimeout(timerMsg);
        }
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

    getDownloadUrl(exportType) {
        let url = '/api/assignations/?';

        const urlParams = Object.assign({}, this.props.params, { [exportType]: true });

        if (urlParams.years) {
            delete urlParams.years;
        }

        Object.keys(urlParams).forEach((key) => {
            const value = urlParams[key];
            if (value && !url.includes(key)) {
                url += `&${key}=${value}`;
            }
        });
        return url;
    }


    removeSavingMsg() {
        if (timerMsg) {
            clearTimeout(timerMsg);
        }
        timerMsg = setTimeout(() => {
            this.setState({
                errorOnSave: undefined,
            });
        }, 10000);
    }

    saveCallBack(isSaved) {
        this.setState({
            isSavingTeam: false,
            errorOnSave: !isSaved,
        });
        this.removeSavingMsg();
        this.props.chageSelectionModified(!isSaved);
    }

    saveTeam() {
        this.setState({ isSavingTeam: true });
        if (this.props.params.workzone_id) {
            saveWorkzonePlanning(
                this.props.selection.assignations,
                parseInt(this.props.params.planning_id, 10),
                this.props.params.workzone_id,
            ).then((isSaved) => {
                this.saveCallBack(isSaved);
            });
        } else if (this.props.params.coordination_id) {
            saveCoordinationPlanning(
                this.props.selection.assignations,
                parseInt(this.props.params.planning_id, 10),
                this.props.params.coordination_id,
            ).then((isSaved) => {
                this.saveCallBack(isSaved);
            });
        }
    }

    // HANDLERS

    deSelectVillage(list) {
        this.props.deselectItems(list);
    }

    activateFullscreenHandler() {
        // give focus to the map, otherwhise we need to click on the map to close it
        const planningMap = document.getElementById('planning-map').getElementsByClassName('map-container')[0];
        if (planningMap) {
            planningMap.focus();
        }
        this.props.activateFullscreen();
    }

    toggleSearchModal() {
        this.setState({
            showSearchModal: !this.state.showSearchModal,
        });
    }


    renderSaveTeamButton() {
        if (!this.props.params.coordination_id && !this.props.params.team_id) {
            return null;
        }
        return (
            <div className="save-assignations">
                {
                    typeof this.state.errorOnSave !== 'undefined'
                        ? !this.state.errorOnSave
                            ? <div className="success"><FormattedMessage id="microplanning.label.save.success" defaultMessage="Selection saved" /></div>
                            : <div className="error"><FormattedMessage id="microplanning.label.save.error" defaultMessage="Error while saving" /></div>
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
                    <FormattedMessage id="microplanning.label.save" defaultMessage="Sauver Sélection" />
                </button>
            </div>
        );
    }


    render() {
        const { formatMessage } = this.props.intl;
        // params filters & load status
        const {
            years, planning_id,
        } = this.props.params;
        const { data, error, loading } = this.props.load;
        // possible years from 2000 to current year
        const possibleYears = getPossibleYears();
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
        const workzones = ((data && data.workzones) || []);
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
                assignationsTempList = assignationsTempList.filter(x => x.team_id === parseInt(this.props.params.team_id, 10));
            }
            selectedVillages = assignationsTempList.filter(assignation => (assignation.team_id !== -1 && assignation.village_id in villagesMap))
                .map(assignation => villagesMap[assignation.village_id]);
            assignationsTempList.map((assignation) => {
                if (villagesMap[assignation.village_id]) {
                    selectedAndUnselectedVillages.push(villagesMap[assignation.village_id]);
                }
                return true;
            });
        }

        const { highlightBufferSize } = selection;

        // map
        const {
            map: {
                baseLayer, legend, fullscreen, withCluster,
            },
        } = this.props;
        const mapClass = `map__panel${fullscreen ? '--fullscreen' : '--right'}`;
        const selectHighlightBuffer = () => {
            const inBuffer = geoUtils.villagesInHighlightBuffer(
                this.props.map.leafletMap,
                villages,
                selection.highlightBufferSize,
            );

            const algoParams = {
                village_id: inBuffer.map(x => x.id).join(','),
                workzone_id: this.props.params.workzone_id,
                years: this.props.params.years,
            };
            this.props.launchAlgo(algoParams);
        };
        let currentTeam;
        if (this.props.params.team_id) {
            [currentTeam] = teams.filter(t => t.id === parseInt(this.props.params.team_id, 10));
        }
        const shortVillageSelectionLegend = villageSelectionLegend.slice();
        shortVillageSelectionLegend.pop();
        let mapLegendItems = villageSelectionLegend.slice(0, 2);
        if (this.props.params.team_id) {
            mapLegendItems = villageSelectionLegend;
        } else if (this.props.params.workzone_id) {
            mapLegendItems = shortVillageSelectionLegend;
        }
        const { showSearchModal } = this.state;
        return (
            <div
                tabIndex={0}
                role="button"
                className="no-button"
                onKeyDown={event => this.onKeyDownHandler(event)}
            >

                <MicroplanningVillageSearch
                    showSearchModal={showSearchModal}
                    filters={{
                        planningId: this.props.params.planning_id,
                        workZoneId: this.props.params.workzone_id,
                        years: this.props.params.years,
                        teamId: this.props.params.team_id,
                    }}
                    assignations={assignations}
                    teams={teams}
                    toggleSearchModal={() => this.toggleSearchModal()}
                    selectItems={(items, activateSaveButton) => this.props.selectItems(items, activateSaveButton)}
                    saveButton={this.renderSaveTeamButton()}
                />
                {
                    loading && <LoadingSpinner message={formatMessage(MESSAGES.loading)} />
                }

                {
                    error
                    && (
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
                    )
                }
                <TeamSelectionTool
                    params={this.props.params}
                    plannings={plannings}
                    coordinations={coordinations}
                    workzones={workzones}
                    teams={teams}
                    redirect={params => this.props.redirect(params)}
                    deselectAll={() => this.props.deselectItems(null, false)}
                    closeTooltip={() => this.props.displayItem(null)}
                />
                {
                    this.props.params.team_id
                    && (
                        <TabsComponent
                            currentTab={this.state.currentTab}
                            selectTab={key => (this.setState({ currentTab: key }))}
                            tabs={[
                                { label: formatMessage(MESSAGES.villageSelection), key: 'villageSelection' },
                                { label: formatMessage(MESSAGES.geoScope), key: 'geoScope' },
                            ]}
                            isRedirecting={false}
                            defaultSelect={this.state.currentTab}
                        />
                    )
                }
                <div className={`widget__container ${this.state.currentTab !== 'villageSelection' ? 'hidden' : ''}`}>
                    <div className="widget__header--tier">
                        {/* Map legend */}
                        <div>
                            <MapLegend
                                items={mapLegendItems}
                            />
                        </div>

                        {/* Param Filters */}
                        <div className="map__header--filters">
                            <div className="map__filters">

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
                                        options={possibleYears.map(value => ({ label: value, value }))}
                                        onChange={yearsList => this.props.redirect({
                                            ...this.props.params,
                                            years: yearsList,
                                        })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <MapLayers
                                base={baseLayer}
                                change={(type, key) => this.props.changeLayer(type, key)}
                                teamId={this.props.params.team_id}
                            />
                        </div>
                    </div>
                    <div className="map__panel__container">
                        {!fullscreen
                            && (
                                <div className="map__panel--left">
                                    <div className="map__selection">
                                        <div className="map__selection__top">
                                            <div className="map__selection__title">
                                                <FormattedMessage id="microplanning.label.selection" defaultMessage="Village selection" />
                                                {
                                                    this.state.isSelectionModified && !this.state.isSavingTeam && !loading
                                                    && (
                                                        <div className="warning-box">
                                                            <FormattedMessage id="microplanning.label.save.needToSave" defaultMessage="Planning modified but not saved" />
                                                        </div>
                                                    )
                                                }
                                            </div>

                                            {/* Selection actions */}
                                            <MapSelectionControl
                                                mode={selection.mode}
                                                teamId={this.props.params.team_id}
                                                workzoneId={this.props.params.workzone_id}
                                                highlightBufferSize={selection.highlightBufferSize}
                                                changeHighlightBufferSize={event => this.props
                                                    .changeHighlightBufferSize(event.target.value)}
                                                selectHighlightBuffer={selectHighlightBuffer}
                                            />

                                            {/* Selected summary */}
                                            {
                                                !this.props.isAssignationLoading
                                                && (
                                                    <MapSelectionSummary
                                                        data={selectedAndUnselectedVillages}
                                                        assignationsMap={assignationsMap}
                                                        capacity={capacity}
                                                    />
                                                )
                                            }
                                        </div>

                                        <div className="map__selection__middle">

                                            {/* Selected list */}
                                            {
                                                this.props.isAssignationLoading
                                                && (
                                                    <div className="loading-small">
                                                        <i className="fa fa-spinner" />
                                                    </div>
                                                )
                                            }
                                            {
                                                !this.props.isAssignationLoading
                                                && (
                                                    <MapSelectionList
                                                        data={selectedAndUnselectedVillages}
                                                        show={item => this.props.displayItem(item)}
                                                        deselect={list => this.deSelectVillage(list)}
                                                        assignationsMap={assignationsMap}
                                                        teamsMap={teamsMap}
                                                        coordinationId={this.props.params.coordination_id}
                                                    />
                                                )
                                            }
                                        </div>

                                        <div className="map__selection__bottom">
                                            {/* actions */}
                                            {this.renderSaveTeamButton()}
                                            <button className="button--tiny middle" onClick={() => this.activateFullscreenHandler()}>
                                                <i className="fa fa-print" />
                                                <FormattedMessage id="microplanning.label.print" defaultMessage="Print map" />
                                            </button>
                                            <DownloadButtonsComponent
                                                csvUrl={this.getDownloadUrl('csv')}
                                                xlsxUrl={this.getDownloadUrl('xlsx')}
                                                smallButtons
                                            />
                                        </div>

                                    </div>
                                </div>
                            )
                        }
                        {/* Map */}
                        <div className={mapClass} id="planning-map">
                            {
                                !this.props.isTest
                                && (
                                    <Map
                                        teams={teams}
                                        teamId={this.props.params.team_id}
                                        planningId={this.props.params.planning_id}
                                        baseLayer={baseLayer}
                                        legend={legend}
                                        fullscreen={fullscreen}
                                        items={villages}
                                        assignationsMap={assignationsMap}
                                        assignations={assignations}
                                        selectedItems={selectedVillages}
                                        highlightBufferSize={highlightBufferSize}
                                        deselectItems
                                        chosenItem={selection.displayedItem}
                                        showItem={item => this.props.displayItem(item)}
                                        leafletMap={map => this.props.setLeafletMap(map)}
                                        getShape={type => this.props.getShape(type)}
                                        selectItems={(items, activateSaveButton) => this.props.selectItems(items, activateSaveButton)}
                                        workzoneId={this.props.params.workzone_id}
                                        withCluster={withCluster}
                                        toggleSearchModal={() => this.toggleSearchModal()}
                                    />
                                )
                            }
                        </div>
                    </div>
                </div>

                <div className={`widget__container ${this.state.currentTab !== 'geoScope' ? 'hidden-opacity' : ''}`}>
                    {
                        currentTeam
                        && (
                            <GeoScope
                                coordinationId={this.props.params.coordination_id}
                                workzoneId={this.props.params.workzone_id}
                                workzones={workzones}
                                teamGeoScope={this.props.selection.geoScope}
                                team={currentTeam}
                                planningId={this.props.params.planning_id}
                            />
                        )
                    }
                </div>
            </div>
        );
    }
}
Microplanning.defaultProps = {
    isTest: false,
};

Microplanning.propTypes = {
    changeHighlightBufferSize: PropTypes.func.isRequired,
    deselectItems: PropTypes.func.isRequired,
    selectItems: PropTypes.func.isRequired,
    displayItem: PropTypes.func.isRequired,
    changeLayer: PropTypes.func.isRequired,
    setLeafletMap: PropTypes.func.isRequired,
    activateFullscreen: PropTypes.func.isRequired,
    deactivateFullscreen: PropTypes.func.isRequired,
    redirect: PropTypes.func.isRequired,
    launchAlgo: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
    selection: PropTypes.object.isRequired,
    getShape: PropTypes.func.isRequired,
    map: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    isTest: PropTypes.bool,
    isAssignationLoading: PropTypes.bool.isRequired,
    chageSelectionModified: PropTypes.func.isRequired,
    changeCluster: PropTypes.func.isRequired,
};

const MicroplanningWithIntl = injectIntl(Microplanning);

const MapDispatchToProps = dispatch => ({
    changeBufferSize: event => dispatch(selectionActions.changeBufferSize(event.target.value)),
    changeHighlightBufferSize: value => dispatch(selectionActions.changeHighlightBufferSize(value)),
    executeSelectionAction: list => dispatch(selectionActions.executeSelection(list)),
    deselectItems: (list, activateSaveButton) => dispatch(selectionActions.deselectItems(list, activateSaveButton)),
    displayItem: item => dispatch(selectionActions.displayItem(item)),
    changeLayer: (type, key) => dispatch(mapActions.changeLayer(type, key)),
    setLeafletMap: map => dispatch(mapActions.setLeafletMap(map)),
    activateFullscreen: () => dispatch(mapActions.activateFullscreen()),
    deactivateFullscreen: () => dispatch(mapActions.deactivateFullscreen()),
    redirect: params => dispatch(push(createUrl(params, 'micro'))),
    getShape: url => getRequest(url, dispatch, null, false),
    chageSelectionModified: isSelectionModified => dispatch(selectionActions.chageSelectionModified(isSelectionModified)),
    changeCluster: withCluster => dispatch(mapActions.changeCluster(withCluster)),
});

const MapStateToProps = state => ({
    config: state.config,
    load: state.load,
    selection: state.selection,
    map: state.map,
});


export default connect(MapStateToProps, MapDispatchToProps)(MicroplanningWithIntl);
