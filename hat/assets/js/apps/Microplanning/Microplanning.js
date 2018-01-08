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
import { createUrl } from '../../utils/fetchData';
import geoUtils from './utils/geo';
import { selectionActions, selectionModes } from './redux/selection';
import { mapActions } from './redux/map';
import {
  Map,
  MapLayers,
  MapLegend,
  MapSelectionControl,
  MapSelectionExport,
  MapSelectionList,
  MapSelectionSummary
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
  constructor (props) {
    super(props)
    this.state = {
      locations: []
    }
  }

  componentWillReceiveProps(newProps) {
    const { data, error, loading } = newProps.load;
    const locations = ((data && data.locations) || []);
    this.setState({
      locations
    })
  }

  /* ***************************************************************************
   * HANDLERS
   ****************************************************************************/

  changeLocationHandler (location) {
    let zs_id = null;
    this.state.locations.map(
      l => {
        if (l[1] === location ) {
          zs_id = l[0];
        }
      }
    )
    this.props.redirect({
      ...this.props.params,
      location,
      zs_id
    })
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
    const { caseyears, location, area } = this.props.params;
    const { data, error, loading } = this.props.load;
    // possible years from 2000 to current year
    const firstYear = 2000;
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear; y >= firstYear; y--) {
      years.push('' + y); // parse to string (Select component needs it)
    }
    const areas = ((data && data.areas) || []);
    const villages = ((data && data.villages) || []).map(geoUtils.extendVillageInfo);
    const teams = ((data && data.teams) || []);
    // selection
    const { selection } = this.props;
    const selectedVillages = (selection.selectedItems || []);

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
        villages.filter((item) => legend[item.type]),
        selection.highlightBufferSize
      )
      if (inBuffer.length > 0) {
        this.props.executeSelectionAction(inBuffer);
      }
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
                    name='location'
                    value={location || ''}
                    placeholder={formatMessage(MESSAGES['location-all'])}
                    options={this.state.locations.map((value) => ({ label: value[1], value: value[1] }))}
                    onChange={(location) =>  this.changeLocationHandler(location)}
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
                    name='area'
                    value={area || ''}
                    placeholder={formatMessage(MESSAGES['location-all'])}
                    options={areas.map((value) => ({ label: value[1], value: value[1] }))}
                    onChange={area =>  this.props.redirect({ ...this.props.params, area })}
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
                    name='caseyears'
                    value={caseyears || ''}
                    placeholder={formatMessage(MESSAGES['years-select'])}
                    options={years.map((value) => ({ label: value, value }))}
                    onChange={caseyears => this.props.redirect({ ...this.props.params, caseyears })}
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
                baseLayer={baseLayer}
                overlays={overlays}
                legend={legend}
                fullscreen={fullscreen}
                items={villages}
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
                      deselect={list => this.props.deselectItems(list)}
                    />
                  </div>

                  <div className='map__selection__bottom'>
                    {/* actions */}
                    <MapSelectionExport data={selectedVillages} />
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

const MicroplanningWithIntl = injectIntl(Microplanning);

Microplanning.propTypes = {
  changeBufferSize: PropTypes.func.isRequired,
  changeHighlightBufferSize: PropTypes.func.isRequired,
  executeSelectionAction: PropTypes.func.isRequired,
  deselectItems: PropTypes.func.isRequired,
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

const MapDispatchToProps = dispatch => ({
  changeBufferSize: event => dispatch(selectionActions.changeBufferSize(event.target.value)),
  changeHighlightBufferSize: event => dispatch(selectionActions.changeHighlightBufferSize(event.target.value)),
  executeSelectionAction: list => dispatch(selectionActions.executeSelection(list)),
  deselectItems: item => dispatch(selectionActions.deselectItems(list)),
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
