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

import React, {Component} from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'
import {FormattedMessage, defineMessages, injectIntl} from 'react-intl'
import Select from 'react-select'

import LoadingSpinner from '../../components/loading-spinner'
import {createUrl} from '../../utils/fetchData'
import geoUtils from './utils/geo'
import {selectionActions, selectionModes} from './redux/selection'
import {mapActions} from './redux/map'
import {
  Map,
  MapLayers,
  MapLegend,
  MapSelectionControl,
  MapSelectionExport,
  MapSelectionList,
  MapSelectionSummary
} from './components'

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
  constructor () {
    super()

    this.changeCaseYearsHandler = this.changeCaseYearsHandler.bind(this)
    this.changeLocationHandler = this.changeLocationHandler.bind(this)

    this.executeSelectionActionHandler = this.executeSelectionActionHandler.bind(this)
    this.deselectItemsHandler = this.deselectItemsHandler.bind(this)
    this.displayItemHandler = this.displayItemHandler.bind(this)

    this.toggleLegendHandler = this.toggleLegendHandler.bind(this)
    this.changeLayerHandler = this.changeLayerHandler.bind(this)
    this.activateFullscreenHandler = this.activateFullscreenHandler.bind(this)

    this.changeSelectionModeHandler = this.changeSelectionModeHandler.bind(this)
    this.changeBufferSizeHandler = this.changeBufferSizeHandler.bind(this)
    this.changeHighlightBufferSizeHandler = this.changeHighlightBufferSizeHandler.bind(this)
    this.setLeafletMap = this.setLeafletMap.bind(this)

    this.onKeyDownHandler = this.onKeyDownHandler.bind(this)
  }

  render () {
    const {formatMessage} = this.props.intl

    // params filters & load status
    const {caseyears, location} = this.props.params
    const {data, error, loading} = this.props.load

    // possible years from 2000 to current year
    const firstYear = 2000
    const currentYear = new Date().getFullYear()
    const years = []
    for (let y = currentYear; y >= firstYear; y--) {
      years.push('' + y) // parse to string (Select component needs it)
    }

    const locations = ((data && data.locations) || [])
    const villages = ((data && data.villages) || []).map(geoUtils.extendVillageInfo)

    // selection
    const {selection} = this.props
    const selectedVillages = (selection.selectedItems || [])

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
    const {baseLayer, overlays, legend, fullscreen} = this.props.map
    const mapClass = 'map__panel' + (fullscreen ? '--fullscreen' : '--left')
    const selectHighlightBuffer = () => {
      const inBuffer = geoUtils.villagesInHighlightBuffer(
        this.props.map.leafletMap,
        villages.filter((item) => legend[item.type]),
        selection.highlightBufferSize
      )
      if (inBuffer.length > 0) {
        this.executeSelectionActionHandler(inBuffer)
      }
    }

    return (
      <div onKeyDown={this.onKeyDownHandler}>
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
                toggle={this.toggleLegendHandler}
              />
            </div>

            {/* Param Filters */}
            <div className='map__header--filters'>
              <div className='map__filters'>
                <div className='map__filters--option'>
                  <span className='map__text--select'>
                    <FormattedMessage
                      id='microplanning.filter.zones'
                      defaultMessage='Show villages in the Zones de Sante' />
                  </span>
                  <Select
                    multi
                    simpleValue
                    autosize={false}
                    disabled={loading}
                    name='location'
                    value={location || ''}
                    placeholder={formatMessage(MESSAGES['location-all'])}
                    options={locations.map((value) => ({label: value, value}))}
                    onChange={this.changeLocationHandler}
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
                    options={years.map((value) => ({label: value, value}))}
                    onChange={this.changeCaseYearsHandler}
                  />
                </div>
              </div>
            </div>

            {/* Map layers */}
            <div className='map__header--layers'>
              <MapLayers
                base={baseLayer}
                overlays={overlays}
                change={this.changeLayerHandler}
              />
            </div>
          </div>

          <div className=''>
            {/* Map */}
            <div className={mapClass}>
              <Map
                baseLayer={baseLayer}
                overlays={overlays}
                legend={legend}
                fullscreen={fullscreen}
                items={villages}
                selectedItems={selectedVillages}
                bufferSize={bufferSize}
                highlightBufferSize={highlightBufferSize}
                selectionAction={this.executeSelectionActionHandler}
                chosenItem={selection.displayedItem}
                showItem={this.displayItemHandler}
                leafletMap={this.setLeafletMap}
              />
            </div>

            { !fullscreen &&
              <div className='map__panel--right'>
                <div className='map__selection'>
                  <div className='map__selection__top'>
                    <div className='map__selection__title'>
                      <FormattedMessage id='microplanning.label.selection' defaultMessage='Village selection' />
                    </div>

                    {/* Selection actions */}
                    <MapSelectionControl
                      mode={selection.mode}
                      changeMode={this.changeSelectionModeHandler}
                      bufferSize={selection.bufferSize}
                      changeBufferSize={this.changeBufferSizeHandler}
                      highlightBufferSize={selection.highlightBufferSize}
                      changeHighlightBufferSize={this.changeHighlightBufferSizeHandler}
                      selectHighlightBuffer={selectHighlightBuffer}
                    />

                    {/* Selected summary */}
                    <MapSelectionSummary data={selectedVillages} />
                  </div>

                  <div className='map__selection__middle'>
                    {/* Selected list */}
                    <MapSelectionList
                      data={selectedVillages}
                      show={this.displayItemHandler}
                      deselect={this.deselectItemsHandler}
                    />
                  </div>

                  <div className='map__selection__bottom'>
                    {/* actions */}
                    <MapSelectionExport data={selectedVillages} />
                    <div>
                      <button className='button--print' onClick={this.activateFullscreenHandler}>
                        <i className='fa fa-print' />
                        <FormattedMessage id='microplanning.label.print' defaultMessage='Print map' />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>

          <div className='widget__footer'>
            <span className='text--data'>
              <FormattedMessage id='microplanning.datasource.label' defaultMessage='Data sources' />
              {':'}
              &nbsp;
              <FormattedMessage id='microplanning.datasource.mobiledata' defaultMessage='HAT mobile application data' />
              {','}
              &nbsp;
              <FormattedMessage id='microplanning.datasource.historical' defaultMessage='HAT historical forms' />
              {','}
              &nbsp;
              <FormattedMessage id='microplanning.datasource.pharmacovigilance' defaultMessage='Pharmacovigilance' />
            </span>
          </div>
        </div>
      </div>
    )
  }

  /* ***************************************************************************
   * HANDLERS
   ****************************************************************************/

  changeCaseYearsHandler (caseyears) {
    this.props.dispatch(push(createUrl({...this.props.params, caseyears})))
  }

  changeLocationHandler (location) {
    this.props.dispatch(push(createUrl({...this.props.params, location})))
  }

  changeSelectionModeHandler (mode) {
    if (this.props.selection.mode === mode) {
      // deactivate
      this.props.dispatch(selectionActions.disableSelection())
    } else {
      this.props.dispatch(selectionActions.changeMode(mode))
    }
  }

  changeBufferSizeHandler (event) {
    this.props.dispatch(selectionActions.changeBufferSize(event.target.value))
  }

  changeHighlightBufferSizeHandler (event) {
    this.props.dispatch(selectionActions.changeHighlightBufferSize(event.target.value))
  }

  executeSelectionActionHandler (list) {
    this.props.dispatch(selectionActions.executeSelection(list))
  }

  deselectItemsHandler (list) {
    this.props.dispatch(selectionActions.deselectItems(list))
  }

  displayItemHandler (item) {
    this.props.dispatch(selectionActions.displayItem(item))
  }

  toggleLegendHandler (legend) {
    this.props.dispatch(mapActions.toggleLegend(legend))
  }

  changeLayerHandler (type, key) {
    this.props.dispatch(mapActions.changeLayer(type, key))
  }

  activateFullscreenHandler () {
    // deactivate selection mode first
    this.props.dispatch(selectionActions.disableSelection())
    this.props.dispatch(mapActions.activateFullscreen())
  }

  setLeafletMap (map) {
    this.props.dispatch(mapActions.setLeafletMap(map))
  }

  onKeyDownHandler (event) {
    switch (event.keyCode) {
      case 27: { // `ESC`
        // deactivate fullscreen
        if (this.props.map.fullscreen) {
          this.props.dispatch(mapActions.deactivateFullscreen())
        }
        break
      }
    }
  }
}

const MicroplanningWithIntl = injectIntl(Microplanning)

export default connect((state, ownProps) => ({
  config: state.config,
  load: state.load,
  selection: state.selection,
  map: state.map
}))(MicroplanningWithIntl)
