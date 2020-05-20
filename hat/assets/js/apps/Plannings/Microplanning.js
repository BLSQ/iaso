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
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import Grid from '@material-ui/core/Grid';

import LoadingSpinner from '../../components/loading-spinner';
import TabsComponent from '../../components/TabsComponent';
import GeoScope from './components/GeoScope';

import { createUrl, getRequest } from '../../utils/fetchData';
import geoUtils from '../../utils/geo';
import { patchRequest } from '../../utils/requests';

import { selectionActions } from './redux/selection';
import { mapActions } from './redux/map';
import { saveAssignations } from './redux/microplanning';
import { enqueueSnackbar, closeFixedSnackbar } from '../../redux/snackBarsReducer';

import { villageSelectionLegend } from './constants/microplanningLegends';
import MicroplanningVillageSearch from './components/MicroplanningVillageSearch';
import { warningSnackBar } from '../../utils/constants/snackBars';

import {
    Map,
    MapLayers,
    MapLegend,
    MapSelectionControl,
    MapSelectionList,
    MapSelectionSummary,
    MicroplanningFilters,
} from './components';
import DownloadButtonsComponent from '../../components/DownloadButtonsComponent';

const MESSAGES = defineMessages({
    'location-all': {
        defaultMessage: 'All',
        id: 'microplanning.labels.all',
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
            currentTab: 'villageSelection',
            showSearchModal: false,
            currentTeam: null,
            displayWarning: false,
        };
    }

    componentWillReceiveProps(nextProps) {
        const {
            params,
            selection,
        } = nextProps;
        const {
            currentTab,
        } = this.state;
        this.setState({
            isSelectionModified: selection.isSelectionModified || false,
            currentTab: !params.team_id ? 'villageSelection' : currentTab,
        });
    }

    componentDidUpdate(prevProps) {
        const {
            changeHighlightBufferSize,
            params,
            teams,
            dispatch,
        } = this.props;
        const {
            currentTeam,
            displayWarning,
            isSelectionModified,
        } = this.state;
        // if we add a team, reset highlight buffer size
        if (params.team_id && !prevProps.params.team_id) {
            changeHighlightBufferSize(0);
        }
        if (params.team_id && !currentTeam && teams.length > 0) {
            this.setCurrentTeam(params.team_id);
        }
        if (isSelectionModified && !displayWarning) {
            this.toggleWarning();
            dispatch(enqueueSnackbar(warningSnackBar(
                'saveWarning',
                {
                    id: 'microplanning.label.save.needToSave',
                    defaultMessage: 'Planning modified but not saved',
                },
            )));
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

    onChangeFilter() {
        const {
            dispatch,
        } = this.props;
        dispatch(closeFixedSnackbar('saveWarning'));
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

    setCurrentTeam(teamId) {
        const {
            teams,
        } = this.props;
        const currentTeam = teams.find(t => t.id === parseInt(teamId, 10));

        this.setState({
            currentTeam,
        });
    }

    toggleWarning() {
        this.setState({
            displayWarning: !this.state.displayWarning,
        });
    }

    saveAssignations() {
        const {
            params,
            selection,
            dispatch,
        } = this.props;
        if (params.workzone_id) {
            this.props.patchRequest(
                `/api/workzones/${params.workzone_id}/`,
                {
                    planning_id: parseInt(params.planning_id, 10),
                    assignations: selection.assignations,
                },
                saveAssignations,
            ).then(() => {
                this.props.changeSelectionModified(false);
                this.toggleWarning();
                dispatch(closeFixedSnackbar('saveWarning'));
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
            params,
            launchAlgo,
        } = this.props;
        const inBuffer = geoUtils.villagesInHighlightBuffer(
            map.leafletMap,
            villages,
            selection.highlightBufferSize,
        );

        const algoParams = {
            village_id: inBuffer.map(x => x.id).join(','),
            workzone_id: params.workzone_id,
            years: params.years,
        };
        launchAlgo(algoParams);
    }


    render() {
        const {
            isAssignationLoading,
            intl: {
                formatMessage,
            },
            params,
            load: {
                loading,
            },
            map: {
                baseLayer,
                legend,
                fullscreen,
                withCluster,
            },
            selection,
            selection: {
                highlightBufferSize,
                assignations,
            },
            displayItem,
            redirect,
            deselectItems,
            changeLayer,
            changeHighlightBufferSize,
            setLeafletMap,
            getShape,
            selectItems,
            villagesObject,
            getAdditionalSelectData,
            teams,
        } = this.props;

        const {
            showSearchModal,
            currentTab,
            currentTeam,
            isSelectionModified,
        } = this.state;


        const villages = [];
        const villagesMap = {};
        if (villagesObject) {
            Object.keys(villagesObject).forEach((villageId) => {
                const fullVillage = geoUtils.extendVillageInfo(villagesObject[villageId]);
                villagesMap[villageId] = fullVillage;
                villages.push(fullVillage);
            });
        }

        const shortVillageSelectionLegend = villageSelectionLegend.slice();
        shortVillageSelectionLegend.pop();
        const teamsMap = {};
        let capacity = currentTeam ? currentTeam.capacity : 0;
        let mapLegendItems = villageSelectionLegend.slice(0, 2);

        let totalCapacity = 0;
        teams.forEach((t) => {
            totalCapacity += t.capacity;
            teamsMap[t.id] = t;
        });
        if (currentTeam) {
            mapLegendItems = villageSelectionLegend;
        } else {
            capacity = totalCapacity;
            if (params.workzone_id) {
                mapLegendItems = shortVillageSelectionLegend;
            }
        }

        const assignationsMap = {};
        assignations.forEach((assignation) => {
            if (assignation.team_id !== -1) {
                assignationsMap[assignation.village_id] = assignation.team_id;
            }
        });

        // planning selection
        // if a planning is selected we need to preselect the villages from the planning
        let selectedVillages = [];
        const selectedAndUnselectedVillages = [];
        if (params.planning_id && villagesObject) {
            let assignationsTempList = [...assignations];

            if (params.team_id) {
                assignationsTempList = assignationsTempList.filter(x => x.team_id === parseInt(params.team_id, 10));
            }
            selectedVillages = assignationsTempList.filter(assignation => (assignation.team_id !== -1 && assignation.village_id in villagesMap))
                .map(assignation => villagesMap[assignation.village_id]);
            assignationsTempList.forEach((assignation) => {
                if (villagesMap[assignation.village_id]) {
                    selectedAndUnselectedVillages.push(villagesMap[assignation.village_id]);
                }
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
                                planningId: params.planning_id,
                                workZoneId: params.workzone_id,
                                years: params.years,
                                teamId: params.team_id,
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
                    (loading || isAssignationLoading) && <LoadingSpinner message={formatMessage(MESSAGES.loading)} />
                }

                <MicroplanningFilters
                    params={params}
                    redirect={(newParams, baseUrl) => redirect(newParams, baseUrl)}
                    deselectAll={() => deselectItems(null, false)}
                    closeTooltip={() => displayItem(null)}
                    getAdditionalSelectData={getAdditionalSelectData}
                    setCurrentTeam={teamId => this.setCurrentTeam(teamId)}
                    capacity={capacity}
                    onChangeFilter={() => this.onChangeFilter()}
                    isSelectionModified={isSelectionModified}
                />
                {
                    currentTeam
                    && villages.length > 0
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

                {
                    villages.length > 0
                    && (
                        <div className={`widget__container ${currentTab !== 'villageSelection' ? 'hidden' : ''}`}>
                            <div className="widget__content">
                                <Grid container spacing={4}>
                                    {
                                        params.workzone_id
                                        && (
                                            <Grid item xs={4}>
                                                <div className="map__selection__title">
                                                    <FormattedMessage id="microplanning.label.selection" defaultMessage="Village selection" />
                                                </div>

                                                {/* Selection actions */}
                                                <MapSelectionControl
                                                    mode={selection.mode}
                                                    teamId={params.team_id}
                                                    workzoneId={params.workzone_id}
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
                                            </Grid>
                                        )
                                    }
                                    {/* Map legend */}
                                    <Grid item xs={4}>
                                        <MapLegend
                                            items={mapLegendItems}
                                        />
                                    </Grid>
                                    <Grid item xs={4}>
                                        <MapLayers
                                            base={baseLayer}
                                            change={(type, key) => changeLayer(type, key)}
                                            teamId={params.team_id}
                                        />
                                    </Grid>
                                </Grid>
                            </div>

                            <div className="map__panel__container">
                                {!fullscreen
                                    && params.workzone_id
                                    && (
                                        <div className="map__panel--left">
                                            <div className="map__selection">
                                                <div className="map__selection__container">

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
                                                                coordinationId={params.coordination_id}
                                                            />
                                                        )
                                                    }
                                                </div>

                                            </div>
                                        </div>
                                    )
                                }
                                {/* Map */}
                                <div
                                    className={`map__panel${fullscreen ? '--fullscreen' : ''}${params.workzone_id ? '--right' : ''}`}
                                    id="planning-map"
                                >
                                    <Map
                                        teams={teams}
                                        teamId={params.team_id}
                                        planningId={params.planning_id}
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
                                        workzoneId={params.workzone_id}
                                        withCluster={withCluster}
                                        toggleSearchModal={() => this.toggleSearchModal()}
                                    />
                                </div>
                            </div>
                            <div className="align-right margin-right">
                                <button className="button middle" onClick={() => this.activateFullscreenHandler()}>
                                    <i className="fa fa-print" />
                                    <FormattedMessage id="microplanning.label.print" defaultMessage="Print map" />
                                </button>
                                <DownloadButtonsComponent
                                    csvUrl={this.getDownloadUrl('csv')}
                                    xlsxUrl={this.getDownloadUrl('xlsx')}
                                />
                                {
                                    params.coordination_id
                                    && params.workzone_id
                                    && (
                                        <button
                                            className="button"
                                            disabled={!isSelectionModified}
                                            onClick={() => this.saveAssignations()}
                                        >
                                            <FormattedMessage
                                                id="microplanning.label.save"
                                                defaultMessage="Save planning"
                                            />
                                        </button>
                                    )
                                }

                            </div>
                        </div>

                    )
                }

                <div className={`widget__container ${this.state.currentTab !== 'geoScope' ? 'hidden-opacity' : ''}`}>
                    {
                        currentTeam
                        && (
                            <GeoScope
                                coordinationId={params.coordination_id}
                                workzoneId={params.workzone_id}
                                team={currentTeam}
                                planningId={params.planning_id}
                            />
                        )
                    }
                </div>

            </div>
        );
    }
}

Microplanning.defaultProps = {
    villagesObject: null,
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
    isAssignationLoading: PropTypes.bool.isRequired,
    changeSelectionModified: PropTypes.func.isRequired,
    villagesObject: PropTypes.object,
    teams: PropTypes.arrayOf(PropTypes.object).isRequired,
    getAdditionalSelectData: PropTypes.func.isRequired,
    patchRequest: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
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
    redirect: (params, baseUrl) => dispatch(push(createUrl(params, baseUrl || 'micro'))),
    getShape: url => getRequest(url, dispatch, null, false),
    changeSelectionModified: isSelectionModified => dispatch(selectionActions.changeSelectionModified(isSelectionModified)),
    ...bindActionCreators({
        patchRequest,
    }, dispatch),
    dispatch,
});

const MapStateToProps = state => ({
    config: state.config,
    load: state.load,
    selection: state.selection,
    map: state.map,
    villagesObject: state.microplanning.villagesObject,
    teams: state.microplanning.teamsList,
});

export default connect(MapStateToProps, MapDispatchToProps)(MicroplanningWithIntl);
