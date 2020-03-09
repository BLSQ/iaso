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
        const {
            changeHighlightBufferSize,
            changeCluster,
            params: {
                team_id,
                workzone_id,
            },
            selection,
        } = nextProps;
        const {
            currentTab,
        } = this.state;
        // if we add a team, reset highlight buffer size
        if (team_id && !this.props.params.team_id) {
            changeHighlightBufferSize(0);
        }
        if ((workzone_id && !this.props.params.workzone_id) || (!workzone_id && this.props.params.workzone_id)) {
            changeCluster(false);
        }
        this.setState({
            isSelectionModified: selection.isSelectionModified || false,
            currentTab: !team_id ? 'villageSelection' : currentTab,
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
        const {
            params: {
                planning_id,
                coordination_id,
                workzone_id,
            },
            selection,
        } = this.props;
        this.setState({ isSavingTeam: true });
        if (workzone_id) {
            saveWorkzonePlanning(
                selection.assignations,
                parseInt(planning_id, 10),
                workzone_id,
            ).then((isSaved) => {
                this.saveCallBack(isSaved);
            });
        } else if (coordination_id) {
            saveCoordinationPlanning(
                selection.assignations,
                parseInt(planning_id, 10),
                coordination_id,
            ).then((isSaved) => {
                this.saveCallBack(isSaved);
            });
        }
    }

    // HANDLERS

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

    selectHighlightBuffer(villages, selection) {
        const {
            map,
            params: {
                years,
                workzone_id,
            },
            launchAlgo,
        } = this.props;
        const inBuffer = geoUtils.villagesInHighlightBuffer(
            map.leafletMap,
            villages,
            selection.highlightBufferSize,
        );

        const algoParams = {
            village_id: inBuffer.map(x => x.id).join(','),
            workzone_id,
            years,
        };
        launchAlgo(algoParams);
    }


    renderSaveTeamButton() {
        const {
            params: {
                team_id,
                coordination_id,
            },
        } = this.props;
        const {
            errorOnSave,
            isSelectionModified,
            isSavingTeam,
        } = this.state;

        if (!coordination_id && !team_id) {
            return null;
        }
        return (
            <div className="save-assignations">
                {
                    typeof errorOnSave !== 'undefined'
                        ? !errorOnSave
                            ? <div className="success"><FormattedMessage id="microplanning.label.save.success" defaultMessage="Selection saved" /></div>
                            : <div className="error"><FormattedMessage id="microplanning.label.save.error" defaultMessage="Error while saving" /></div>
                        : null
                }
                <button
                    className="button--save"
                    disabled={!isSelectionModified || isSavingTeam}
                    onClick={() => this.saveTeam()}
                >
                    {
                        isSavingTeam ? <i className="fa fa-spinner" /> : <i className="fa fa-save" />
                    }
                    <FormattedMessage id="microplanning.label.save" defaultMessage="Sauver Sélection" />
                </button>
            </div>
        );
    }

    render() {
        const {
            isTest,
            isAssignationLoading,
            intl: {
                formatMessage,
            },
            params: {
                years,
                planning_id,
                team_id,
                workzone_id,
                coordination_id,
            },
            params,
            load: {
                data,
                error,
                loading,
            },
            map: {
                baseLayer,
                legend,
                fullscreen,
                withCluster,
            },
            selection,
            displayItem,
            redirect,
            deselectItems,
            changeLayer,
            changeHighlightBufferSize,
            setLeafletMap,
            getShape,
            selectItems,
        } = this.props;
        const {
            showSearchModal,
            currentTab,
        } = this.state;

        const { highlightBufferSize } = selection;
        const teams = ((data && data.teams) || []);
        const coordinations = ((data && data.coordinations) || []);
        const workzones = ((data && data.workzones) || []);
        const plannings = ((data && data.plannings) || []);
        const assignations = (selection.assignations) || [];

        // possible years from 2000 to current year
        const possibleYears = getPossibleYears();
        const villagesMap = {};
        const teamsMap = {};
        const assignationsMap = {};


        let villages = [];
        let selectedVillages = [];
        let currentTeam;
        const selectedAndUnselectedVillages = [];
        const mapClass = `map__panel${fullscreen ? '--fullscreen' : '--right'}`;
        const shortVillageSelectionLegend = villageSelectionLegend.slice();
        shortVillageSelectionLegend.pop();
        let mapLegendItems = villageSelectionLegend.slice(0, 2);
        let team;

        if (data && data.villagesMap) {
            for (const villageId of Object.keys(data.villagesMap)) {
                villagesMap[villageId] = geoUtils.extendVillageInfo(data.villagesMap[villageId]);
            }
            villages = Object.keys(villagesMap).map(key => villagesMap[key]);
        }
        if (team_id) {
            [currentTeam] = teams.filter(t => t.id === parseInt(team_id, 10));
            mapLegendItems = villageSelectionLegend;
            team = teamsMap[team_id];
        } else if (workzone_id) {
            mapLegendItems = shortVillageSelectionLegend;
        }

        let capacity = team ? team.capacity : 0;

        if (!team) {
            for (let i = 0; i < teams.length; i += 1) {
                team = teams[i];
                teamsMap[team.id] = team;
                capacity += team.capacity;
            }
        }
        for (let i = 0; i < assignations.length; i += 1) {
            const assignation = assignations[i];
            if (assignation.team_id !== -1) {
                assignationsMap[assignation.village_id] = assignation.team_id;
            }
        }

        // planning selection
        // if a planning is selected we need to preselect the villages from the planning
        if (planning_id && data && data.villagesMap) {
            let assignationsTempList = assignations;

            if (team_id) {
                assignationsTempList = assignationsTempList.filter(x => x.team_id === parseInt(team_id, 10));
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

        return (
            <div
                tabIndex={0}
                role="button"
                className="no-button"
                onKeyDown={event => this.onKeyDownHandler(event)}
            >
                {
                    !loading
                    && !isAssignationLoading
                    && (
                        <MicroplanningVillageSearch
                            showSearchModal={showSearchModal}
                            filters={{
                                planningId: planning_id,
                                workZoneId: workzone_id,
                                years,
                                teamId: team_id,
                            }}
                            assignations={assignations}
                            toggleSearchModal={() => this.toggleSearchModal()}
                            displayItem={item => displayItem(item)}
                            villages={villages}
                            teams={teams}
                        />
                    )
                }

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
                    params={params}
                    plannings={plannings}
                    coordinations={coordinations}
                    workzones={workzones}
                    teams={teams}
                    redirect={newParams => redirect(newParams)}
                    deselectAll={() => deselectItems(null, false)}
                    closeTooltip={() => displayItem(null)}
                />
                {
                    team_id
                    && (
                        <TabsComponent
                            currentTab={currentTab}
                            selectTab={key => (this.setState({ currentTab: key }))}
                            tabs={[
                                { label: formatMessage(MESSAGES.villageSelection), key: 'villageSelection' },
                                { label: formatMessage(MESSAGES.geoScope), key: 'geoScope' },
                            ]}
                            isRedirecting={false}
                            defaultSelect={currentTab}
                        />
                    )
                }
                <div className={`widget__container ${currentTab !== 'villageSelection' ? 'hidden' : ''}`}>
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
                                        onChange={yearsList => redirect({
                                            ...params,
                                            years: yearsList,
                                        })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <MapLayers
                                base={baseLayer}
                                change={(type, key) => changeLayer(type, key)}
                                teamId={team_id}
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
                                                teamId={team_id}
                                                workzoneId={workzone_id}
                                                highlightBufferSize={selection.highlightBufferSize}
                                                changeHighlightBufferSize={event => changeHighlightBufferSize(event.target.value)}
                                                selectHighlightBuffer={() => this.selectHighlightBuffer(villages, selection)}
                                            />

                                            {/* Selected summary */}
                                            {
                                                !isAssignationLoading
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
                                                isAssignationLoading
                                                && (
                                                    <div className="loading-small">
                                                        <i className="fa fa-spinner" />
                                                    </div>
                                                )
                                            }
                                            {
                                                !isAssignationLoading
                                                && (
                                                    <MapSelectionList
                                                        data={selectedAndUnselectedVillages}
                                                        show={item => displayItem(item)}
                                                        deselect={list => deselectItems(list)}
                                                        assignationsMap={assignationsMap}
                                                        teamsMap={teamsMap}
                                                        coordinationId={coordination_id}
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
                                !isTest
                                && (
                                    <Map
                                        teams={teams}
                                        teamId={team_id}
                                        planningId={planning_id}
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
                                        showItem={item => displayItem(item)}
                                        leafletMap={map => setLeafletMap(map)}
                                        getShape={type => getShape(type)}
                                        selectItems={(items, activateSaveButton) => selectItems(items, activateSaveButton)}
                                        workzoneId={workzone_id}
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
                                coordinationId={coordination_id}
                                workzoneId={workzone_id}
                                workzones={workzones}
                                teamGeoScope={selection.geoScope}
                                team={currentTeam}
                                planningId={planning_id}
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
