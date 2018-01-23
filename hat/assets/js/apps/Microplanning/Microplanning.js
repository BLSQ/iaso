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

const request = require('superagent');

import LoadingSpinner from '../../components/loading-spinner';
import { createUrl } from '../../utils/fetchData';
import { saveTeamPlanning, saveCoordinationPlanning } from '../../utils/saveData';
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
  TeamSelectionTool
} from './components';

const MESSAGES = defineMessages({
  'location-all': {
    defaultMessage: 'All',
    id: 'microplanning.labels.all'
  },
  'years-select': {
    defaultMessage: 'Select years',
    id: 'microplanning.labels.years.select'
  },
  'loading': {
    defaultMessage: 'Loading villages',
    id: 'microplanning.labels.loading'
  }
})

export class Microplanning extends Component {
  constructor(props) {
    super(props)
    this.state = {
      locations: [],
      selectedLocation: null,
      isVillageListEdited: false,
      isSelectionModified: false,
      errorOnSave: undefined
    }
  }

  componentWillReceiveProps(nextProps) {
    const { data, error, loading } = nextProps.load;
    const locations = ((data && data.locations) || []);
    // TODO : make this work again
    this.setState({
      isSelectionModified: true ,
      locations
    })
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
              <div className="success"><FormattedMessage id='microplanning.label.save.success' defaultMessage='Selection saved' /></div> :
              <div className="error"><FormattedMessage id='microplanning.label.save.error' defaultMessage='Error while saving' /></div>
            : null
        }
        <button
          className='button--save'
          disabled={!this.state.isSelectionModified || this.state.isSavingTeam}
          onClick={() => this.saveTeam()}
        >
          {
            this.state.isSavingTeam ? <i className='fa fa-spinner' /> : <i className='fa fa-save' />
          }
          <FormattedMessage id='microplanning.label.save' defaultMessage='Save Selection' />
        </button>
      </div>
    );
  }

  saveTeam () {

    if (this.props.params.team_id) {
      let tempVillages = this.props.selection.assignations.filter(v => v.team_id == this.props.params.team_id)
      this.setState({isSavingTeam: true})
      saveTeamPlanning(tempVillages, parseInt(this.props.params.planning_id), this.props.params.team_id).then(isSaved => {
        this.setState({
          isSavingTeam: false,
          isSelectionModified: !isSaved,
          errorOnSave: !isSaved
        })
      })
    }
    else {
      this.setState({isSavingTeam: true})
      saveCoordinationPlanning(
        this.props.selection.assignations,
        parseInt(this.props.params.planning_id),
        this.props.params.coordination_id).then(isSaved =>{
              this.setState({
          isSavingTeam: false,
          isSelectionModified: !isSaved,
          errorOnSave: !isSaved
        })
      })
    }

  }

  /* ***************************************************************************
   * HANDLERS
   ****************************************************************************/
  deSelectVillage(list) {
    this.setState({
      isVillageListEdited: true
    });
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
    planningMap ? planningMap.focus() : null;
    this.props.activateFullscreen();
  }

  onKeyDownHandler(event) {
    switch (event.keyCode) {
      case 27: { // `ESC`
        // deactivate fullscreen
        if (this.props.map.fullscreen) {
          this.props.deactivateFullscreen();
        }
        break
      }
    }
  }

  render() {
    const { formatMessage } = this.props.intl;
    // params filters & load status
    const { years, zs_id, as_id, planning_id, coordination_id } = this.props.params;
    const { data, error, loading } = this.props.load;
    // possible years from 2000 to current year
    const firstYear = 2000;
    const currentYear = new Date().getFullYear();
    const possibleYears = [];
    for (let y = currentYear; y >= firstYear; y--) {
      possibleYears.push('' + y); // parse to string (Select component needs it)
    }
    const areas = ((data && data.areas) || []);
    let villages = [];
    let villagesMap = {};
    if (data && data.villagesMap)
    {
      for (const villageId of Object.keys(data.villagesMap))
      {
        villagesMap[villageId] = geoUtils.extendVillageInfo(data.villagesMap[villageId])
      }
      villages = Object.keys(villagesMap).map(key => villagesMap[key])
    }

    const teams = ((data && data.teams) || []);
    const coordinations = ((data && data.coordinations) || []);
    let plannings = ((data && data.plannings) || []);
    const assignations = (this.props.selection.assignations) || [];

    const { selection } = this.props;

    let selectedVillages = [];
    // planning selection
    // if a planning is selected we need to preselect the villages from the planning
    if (planning_id &&
      data &&
      data.villagesMap) {

      let assignationsTempList = assignations;

      if (this.props.params.team_id ) {
        assignationsTempList = assignationsTempList.filter( x =>  x.team_id == this.props.params.team_id)
      }

      selectedVillages = assignationsTempList.map(assignation => villagesMap[assignation.village_id]);

    }

    // buffer sizes
    const bufferSize = (
      (selection.mode !== selectionModes.none)
        ? selection.bufferSize
        : 0)
    const highlightBufferSize = (
      (selection.mode === selectionModes.select)
        ? selection.highlightBufferSize
        : 0)

    // map
    const { baseLayer, overlays, legend, fullscreen } = this.props.map;
    const mapClass = 'map__panel' + (fullscreen ? '--fullscreen' : '--left');
    const selectHighlightBuffer = () => {

      const inBuffer = geoUtils.villagesInHighlightBuffer(
        this.props.map.leafletMap,
        villages,
        selection.highlightBufferSize
      )

      let algoParams = {
        'village_id': inBuffer.map(x => x.id).join(','),
        'coordination_id': this.props.params.coordination_id,
        'years': this.props.params.years
      }

      request
      .get(`/api/algo/`)
      .query(algoParams)
      .then(result => {
        this.props.selectItems(result.body)
      }).catch((err) => {
        console.error('Error when calling algo');
      });

     /* if (inBuffer.length > 0) {
        this.props.executeSelectionAction(inBuffer);
      }*/
    }
    return (
      <div onKeyDown={event => this.onKeyDownHandler(event)}>
        {
          loading && <LoadingSpinner message={formatMessage(MESSAGES['loading'])} />
        }

        {
          error &&
          <div className='widget__container'>
            <div className='widget__header'>
              <h2 className='widget__heading text--error'>
                <FormattedMessage id='microplanning.label.error' defaultMessage='Error:' />
              </h2>
            </div>
            <div className='widget__content'>
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
        <div className='widget__container'>
          <div className='widget__header'>
            {/* Map legend */}
            <div className='map__header--legend'>
              <MapLegend
                legend={legend}
                toggle={legend => this.props.toggleLegend(legend)}
              />
            </div>

            {/* Param Filters */}
            <div className='map__header--filters'>
              <div className='map__filters'>
                <div className='map__filters--option'>
                  <span className='map__text--select'>
                    <FormattedMessage
                      id='microplanning.filter.zones'
                      defaultMessage='Zones de santé' />
                  </span>
                  <Select
                    multi
                    simpleValue
                    autosize={false}
                    disabled={loading}
                    name='zs_id'
                    value={zs_id || ''}
                    placeholder={formatMessage(MESSAGES['location-all'])}
                    options={this.state.locations.map((zs) => ({ label: zs.name, value: zs.id }))}
                    onChange={zs_id => this.props.redirect({ ...this.props.params, zs_id })}
                  />
                </div>

                <div className='map__filters--option'>
                  <span className='map__text--select'>
                    <FormattedMessage
                      id='microplanning.filter.area'
                      defaultMessage='Aires de santé' />
                  </span>
                  <Select
                    multi
                    simpleValue
                    autosize={false}
                    disabled={loading}
                    name='as_id'
                    value={as_id || ''}
                    placeholder={formatMessage(MESSAGES['location-all'])}
                    options={areas.map((as) => ({ label: as.name, value: as.id }))}
                    onChange={as_id => this.props.redirect({ ...this.props.params, as_id })}
                  />
                </div>

                <div className='map__filters--option'>
                  <span className='map__text--select'>
                    <FormattedMessage
                      id='microplanning.filter.cases.date'
                      defaultMessage='Highlight villages with last HAT case in years' />
                  </span>
                  <Select
                    multi
                    simpleValue
                    autosize={false}
                    disabled={loading}
                    name='years'
                    value={years || ''}
                    placeholder={formatMessage(MESSAGES['years-select'])}
                    options={possibleYears.map((value) => ({ label: value, value }))}
                    onChange={years => this.props.redirect({ ...this.props.params, years })}
                  />
                </div>
              </div>
            </div>

            {/* Map layers */}
            <div className='map__header--layers'>
              <MapLayers
                base={baseLayer}
                overlays={overlays}
                change={(type, key) => this.props.changeLayer(type, key)}
              />
            </div>
          </div>
          <div className=''>
            {/* Map */}
            <div className={mapClass} id="planning-map">
              <Map
                teams={teams}
                teamId={this.props.params.team_id}
                planningId={this.props.params.planning_id}
                baseLayer={baseLayer}
                overlays={overlays}
                legend={legend}
                fullscreen={fullscreen}
                items={villages}
                assignations={assignations}
                selectedItems={selectedVillages}
                bufferSize={bufferSize}
                highlightBufferSize={highlightBufferSize}
                selectionAction={list => this.props.executeSelectionAction(list)}
                chosenItem={selection.displayedItem}
                showItem={item => this.props.displayItem(item)}
                leafletMap={map => this.props.setLeafletMap(map)}
              />
            </div>

            {!fullscreen &&
              <div className='map__panel--right'>
                <div className='map__selection'>
                  <div className='map__selection__top'>
                    <div className='map__selection__title'>
                      <FormattedMessage id='microplanning.label.selection' defaultMessage='Village selection' />
                    </div>

                    {/* Selection actions */}
                    <MapSelectionControl
                      mode={selection.mode}
                      changeMode={mode => this.changeSelectionModeHandler(mode)}
                      bufferSize={selection.bufferSize}
                      changeBufferSize={event => this.props.changeBufferSize(event)}
                      highlightBufferSize={selection.highlightBufferSize}
                      changeHighlightBufferSize={event => this.props.changeHighlightBufferSize(event)}
                      selectHighlightBuffer={selectHighlightBuffer}
                    />

                    {/* Selected summary */}
                    <MapSelectionSummary data={selectedVillages} />
                  </div>

                  <div className='map__selection__middle'>
                    {/* Selected list */}
                    <MapSelectionList
                      data={selectedVillages}
                      show={item => this.props.displayItem(item)}
                      deselect={list => this.deSelectVillage(list)}
                    />
                  </div>

                  <div className='map__selection__bottom'>
                    {/* actions */}
                    {this.renderSaveTeamButton()}
                    <div>
                      <button className='button--print' onClick={() => this.activateFullscreenHandler()}>
                        <i className='fa fa-print' />
                        <FormattedMessage id='microplanning.label.print' defaultMessage='Print map' />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    )
  }
}

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
  redirect: PropTypes.func.isRequired
};

const MicroplanningWithIntl = injectIntl(Microplanning);
const MapDispatchToProps = dispatch => ({
  changeBufferSize: event => dispatch(selectionActions.changeBufferSize(event.target.value)),
  changeHighlightBufferSize: event => dispatch(selectionActions.changeHighlightBufferSize(event.target.value)),

  executeSelectionAction: list => dispatch(selectionActions.executeSelection(list)),
  deselectItems: list => dispatch(selectionActions.deselectItems(list)),
  selectItems: list => dispatch(selectionActions.selectItems(list)),
  displayItem: item => dispatch(selectionActions.displayItem(item)),
  toggleLegend: legend => dispatch(mapActions.toggleLegend(legend)),
  changeLayer: (type, key) => dispatch(mapActions.changeLayer(type, key)),
  setLeafletMap: map => dispatch(mapActions.setLeafletMap(map)),
  disableSelection: () => dispatch(selectionActions.disableSelection()),
  activateFullscreen: () => dispatch(mapActions.activateFullscreen()),
  deactivateFullscreen: () => dispatch(mapActions.deactivateFullscreen()),
  changeMode: mode => dispatch(selectionActions.changeMode(mode)),
  redirect: params => dispatch(push(createUrl(params)))
});

const MapStateToProps = state => ({
  config: state.config,
  load: state.load,
  selection: state.selection,
  map: state.map
});


export default connect(MapStateToProps, MapDispatchToProps)(MicroplanningWithIntl);
