import React, {Component, PropTypes} from 'react'
import ReactDOM from 'react-dom'
import { FormattedMessage, IntlProvider, defineMessages, injectIntl, intlShape } from 'react-intl'

import L from 'leaflet'
import geoData from '../utils/geoData'
import {
  MapLegend,
  MapSelectionControl,
  MapSelectionList,
  MapTooltip
} from './index'

// map base layers (the `key` is the label used in the layers control)
const baseLayers = {
  'Blank': L.tileLayer(''),
  'Open Street Map': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
  'ArcGIS Street Map': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}.jpg'),
  'ArcGIS Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.jpg'),
  'ArcGIS Topo Map': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}.jpg')
}
// this is the default base layer, it should match one of the base layers keys
const DEFAULT_LAYER = 'ArcGIS Topo Map'

// circle size in metres depending on the village type
const RADIUS = {
  official: 350,
  other: 150,
  unknown: 150,
  highlight: 80, // amount to increase if there are cases
  buffer: 5 // default buffer value (5km)
}

const SELECTION_MODES = {
  none: 0,
  select: 1,
  deselect: -1
}

const MESSAGES = defineMessages({
  'fit-to-bounds': {
    defaultMessage: 'center to highlighted villages',
    id: 'microplanning.label.fitToBounds'
  }
})

// find all the entries in the list that match exact
// with the item values in the indicated keys list
//
// keys: [ 'a', 'b', 'c' ]
// item: { a: 'aàa', b: 'bBb', c: 'cçC', d: 'xxx' }
// one matched value could be: { a: 'AaA', b: 'bbb', c: 'ÇÇÇ', f: 'zzz' }
const findInData = (list, item, keys) => {
  // taken from sense-hat-mobile
  const stripAccents = (word) => {
    return (word || '').toUpperCase()
      .replace(/[ÀÁÂÄ]/, 'A')
      .replace(/[ÈÉÊ]/, 'E')
      .replace('Ç', 'C')
      .replace('Û', 'U')
      .replace(/[^A-Z0-9]/g, '')
  }

  return list.filter((entry) => (
    keys.every((key) => stripAccents(entry[key]) === stripAccents(item[key]))
  ))
}

class Map extends Component {
  constructor (props) {
    super(props)

    this.state = {
      // leaflet map object
      map: null,
      // where to plot the selected, highlighted and buffer markers
      highlightGroup: new L.FeatureGroup(),
      selectedGroup: new L.FeatureGroup(),
      // where to plot ALL villages; in different groups based on type
      markersGroup: {
        official: new L.FeatureGroup(),
        other: new L.FeatureGroup(),
        unknown: new L.FeatureGroup()
      },
      legend: { official: true, other: false, unknown: false },
      selection: {
        mode: SELECTION_MODES.none,
        bufferSize: RADIUS.buffer,
        controlContainer: null
      }
    }

    this.legendToggleHandler = this.legendToggleHandler.bind(this)
    this.bufferChangeHandler = this.bufferChangeHandler.bind(this)
    this.selectionModeChangeHandler = this.selectionModeChangeHandler.bind(this)
  }

  componentDidMount () {
    this.state.map = this.createMap()
    this.includeControlsInMap(this.state.map)
    this.includeDefaultLayersInMap(this.state.map)
  }
  componentDidUpdate () {
    this.state.map.whenReady(() => {
      // reset previous state
      this.state.highlightGroup.clearLayers()
      this.state.selectedGroup.clearLayers()
      this.state.map.off('mousemove') // remove ALL previous listeners
      this.state.map.on('mousemove', (event) => {
        // dirty: we don't want to dispatch a new state
        this._currentPosition = event.latlng
      })

      this.updateVillages()
      this.updateHighlightedItems()
      this.updateSelectedItems()
      this.updateSelectionMode()
    })
  }
  componentWillUnmount () {
    if (this.state.map) {
      this.state.map.remove()
    }
  }
  render () {
    const { legend, selection } = this.state
    const { selectedItems, deselect } = this.props
    const showSelectionList = (selection.mode !== SELECTION_MODES.none) || (selectedItems.length > 0)
    const mapClass = (!showSelectionList ? 'map__panel' : 'map__panel--left')

    let selectionList = ''
    if (showSelectionList) {
      selectionList = (
        <div className='map__panel--right'>
          <MapSelectionList
            data={selectedItems}
            show={(item) => this.openPopup(item, item._latlon)}
            deselect={deselect} />
        </div>
      )
    }

    return (
      <div className='widget__container'>
        <div className='widget__header'>
          <MapLegend
            legend={legend}
            legendToggle={this.legendToggleHandler}
          />
        </div>
        <div className=''>
          <div className={mapClass}>
            <div ref={(node) => (this.mapContainer = node)} className='map-container' />
          </div>
          {selectionList}
        </div>
        <div className='widget__footer'>
          <span className='text--data'>
            <FormattedMessage id='microplanning.datasource.label' defaultMessage='Data sources' />:&nbsp;
            <FormattedMessage id='microplanning.datasource.mobiledata' defaultMessage='HAT mobile application data' />,&nbsp;
            <FormattedMessage id='microplanning.datasource.historical' defaultMessage='HAT historical forms' />,&nbsp;
            <FormattedMessage id='microplanning.datasource.pharmacovigilance' defaultMessage='Pharmacovigilance' />
          </span>
        </div>
      </div>
    )
  }

  createMap () {
    const node = this.mapContainer

    // HACK: Work around for testing Leaflet in JSDOM
    // see: https://github.com/Leaflet/Leaflet/issues/4823
    if (!node.clientWidth && !node.clientHeight) {
      node.clientHeight = 720
      node.clientWidth = 1000
    }

    // create map
    const map = L.map(node, {
      attributionControl: false,
      zoomControl: false,
      center: geoData.center,
      zoom: geoData.zoom
    })

    // add the default base layer
    baseLayers[DEFAULT_LAYER].addTo(map)

    // create panes (to preserve z-index order)
    map.createPane('custom-pane-layers')
    map.createPane('custom-pane-shadows')
    map.createPane('custom-pane-markers')
    map.createPane('custom-pane-buffer')

    // show metric scale
    L.control.scale({ imperial: false }).addTo(map)

    return map
  }

  includeControlsInMap (map) {
    // The order in which the controls are added matters
    //
    // In TOP-LEFT
    // 1.- selection control
    // 2.- zoom control
    // 3.- fit to bounds control
    // 4.- layers control (so far only for base tiles)

    const commonOptions = {position: 'topleft'}

    // control to `activate selection mode`
    const selectionControl = L.control(commonOptions)
    selectionControl.onAdd = (map) => {
      return L.DomUtil.create('div')
    }
    selectionControl.addTo(map)
    this.state.selection.controlContainer = selectionControl.getContainer()

    // zoom control (standard)
    L.control.zoom(commonOptions).addTo(map)

    // control to `fitToBounds`
    const fitToBoundsControl = L.control(commonOptions)
    fitToBoundsControl.onAdd = (map) => {
      const div = L.DomUtil.create('div', 'map__control__button')
      this.renderFitToBoundsControl(div)
      L.DomEvent.on(div, 'click', (event) => {
        L.DomEvent.stop(event)
        this.fitToBounds()
      })

      return div
    }
    fitToBoundsControl.addTo(map)

    // layer control (standard)
    L.control.layers(baseLayers, null, commonOptions).addTo(map)

    return map
  }

  includeDefaultLayersInMap (map) {
    // include dynamic layers (highlight, selected, buffer...)
    map.addLayer(this.state.highlightGroup)
    map.addLayer(this.state.selectedGroup)

    const shapeOptions = {
      pane: 'custom-pane-layers',
      style: () => ({className: 'map-layer transparent'}),
      onEachFeature: (feature, layer) => {
        this.addLayerEvents(layer, feature.properties)
      }
    }

    // plot the ALL zones boundaries
    map.addLayer(L.geoJson(geoData.zones, shapeOptions))

    // use for the areas
    const areasGroup = new L.FeatureGroup()
    areasGroup.addLayer(L.geoJson(geoData.areas, shapeOptions))

    L.DomEvent.on(map, 'zoomend', (event) => {
      // plot the AREAS if the zoom is greater than 9
      if (map.getZoom() > 9) {
        if (!map.hasLayer(areasGroup)) {
          map.addLayer(areasGroup)
        }
      } else {
        if (map.hasLayer(areasGroup)) {
          map.removeLayer(areasGroup)
        }
      }
    })

    return map
  }

  updateVillages () {
    const { legend } = this.state

    // plot indicated villages (active in legend)
    Object.keys(legend).forEach((key) => {
      this.plotVillagesByType(key, legend[key])
    })
  }

  getHighlightedItems () {
    const { legend } = this.state

    return this.props.highlightedItems
      // remove not matched/reconciled villages (not in list)
      .filter((item) => findInData(geoData.villages, item, ['zone', 'area', 'village']).length > 0)
      .map((item) => {
        const matched = findInData(geoData.villages, item, ['zone', 'area', 'village'])[0]
        return { ...item, ...matched }
      })
      .filter((item) => legend[item.type])
  }

  updateHighlightedItems () {
    const { highlightGroup } = this.state

    this.getHighlightedItems().forEach((item) => {
      const radius = RADIUS[item.type] + RADIUS.highlight
      const options = {
        pane: 'custom-pane-markers',
        radius: radius,
        className: 'map-marker highlight'
      }
      const shadowOptions = {
        pane: 'custom-pane-shadows',
        radius: (2 * radius),
        className: 'map-marker shadow'
      }

      const markerShadow = L.circle(item._latlon, shadowOptions)
      const marker = L.circle(item._latlon, options)
      this.addLayerEvents(marker, item)

      highlightGroup.addLayer(markerShadow)
      highlightGroup.addLayer(marker)
    })
  }

  updateSelectedItems () {
    const { selectedGroup } = this.state
    const { selectedItems } = this.props

    selectedItems.forEach((item) => {
      // take size from village type and increase it if there are cases
      const radius = RADIUS[item.type] + ((item.confirmedCases > 0) ? RADIUS.highlight : 0)
      const options = {
        pane: 'custom-pane-markers',
        radius: radius,
        className: 'map-marker selected'
      }

      const marker = L.circle(item._latlon, options)
      this.addLayerEvents(marker, {...item, selected: true})
      selectedGroup.addLayer(marker)
    })
  }

  updateSelectionMode () {
    const {mode, bufferSize} = this.state.selection

    this.renderSelectionControl()

    // create buffer marker that follows mouse movements
    if (mode && mode !== SELECTION_MODES.none && bufferSize > 0) {
      const { selectedGroup, legend } = this.state
      const bufferRadius = bufferSize * 500 // in metres (buffer size = diameter = 2 * radius)
      const plotted = geoData.villages.filter((item) => (legend[item.type]))
      const highlightedItems = this.getHighlightedItems()

      // create buffer zone around the highlighted village
      const bufferZone = L.circle(this._currentPosition || this.state.map.getCenter(), {
        pane: 'custom-pane-buffer',
        radius: bufferRadius,
        className: 'map-marker buffer'
      })
      selectedGroup.addLayer(bufferZone)

      bufferZone.on({
        click: (event) => {
          L.DomEvent.stop(event)
          // find out the points within the buffer zone
          // TO BE IMPROVED (quadratic)
          const inBuffer = plotted
            .filter((entry) => (
              event.latlng.distanceTo(entry._latlon) <= (bufferRadius + RADIUS[entry.type])
            ))
            .map((item) => {
              const matched = findInData(highlightedItems, item, ['zone', 'area', 'village'])[0]
              return { ...matched, ...item }
            })
          this.executeSelectionAction(inBuffer)
        }
      })

      this.state.map.on('mousemove', (event) => {
        L.DomEvent.stop(event)
        // fires exception `undefined`
        // bufferZone.setLatLng(event.latlng)
        // workaround
        bufferZone._latlng = L.latLng(event.latlng)
        bufferZone.redraw()
      })
    }
  }

  fitToBounds () {
    const {map, highlightGroup} = this.state
    setTimeout(() => {
      if (highlightGroup.getLayers().length) {
        map.fitBounds(highlightGroup.getBounds(), { maxZoom: 13 })
      } else {
        map.setView(geoData.center, geoData.zoom)
      }
      map.invalidateSize()
    }, 1)
  }

  plotVillagesByType (type, active) {
    const {map, markersGroup} = this.state

    const layer = markersGroup[type]
    if (active) {
      // include layer
      if (!map.hasLayer(layer)) {
        map.addLayer(layer)

        // check if the layer has markers
        if (layer.getLayers().length === 0) {
          geoData.villages
            .filter((item) => item.type === type)
            .forEach((item, index) => {
              const options = {
                pane: 'custom-pane-markers',
                radius: RADIUS[type],
                className: 'map-marker ' + type
              }

              const marker = L.circle(item._latlon, options)
              this.addLayerEvents(marker, item)
              layer.addLayer(marker)
            })
        }
      }
    } else {
      // remove layer
      if (map.hasLayer(layer)) {
        map.removeLayer(layer)
      }
    }
  }

  addLayerEvents (layer, item) {
    layer.on({
      click: (event) => {
        L.DomEvent.stop(event)
        if (this.state.selection.mode === SELECTION_MODES.none) {
          this.openPopup(item, event.latlng)
        }
      },
      contextmenu: (event) => {
        L.DomEvent.stop(event)
        this.openPopup(item, event.latlng)
      }
    })
    // layer.bindTooltip(item._label, { sticky: true })
  }

  openPopup (item, latlng) {
    const div = L.DomUtil.create('div', 'tooltip')
    let entry = item

    if (!item.isVillage) {
      const {highlightedItems} = this.props
      // find the higlighted items in shape
      const findInShape = (item) => (findInData(highlightedItems, item, item._keys))
      const inShape = findInShape(item)

      // find out the number of cases and the onset date of the last case
      const confirmedCases = inShape.reduce((prev, curr) => (prev + curr.confirmedCases), 0)
      const screenedPeople = inShape.reduce((prev, curr) => (prev + curr.screenedPeople), 0)
      const lastConfirmedCaseDate = inShape.reduce((prev, curr) => (prev >= curr.lastConfirmedCaseDate ? prev : curr.lastConfirmedCaseDate), '')
      const lastScreeningDate = inShape.reduce((prev, curr) => (prev >= curr.lastScreeningDate ? prev : curr.lastScreeningDate), '')

      entry = {
        ...item,
        confirmedCases,
        lastConfirmedCaseDate,
        screenedPeople,
        lastScreeningDate
      }
    }

    ReactDOM.render(this.injectI18n(<MapTooltip item={entry} />), div)
    this.state.map.openPopup(div, latlng, { minWidth: 200, maxWidth: 500 })
  }

  renderFitToBoundsControl (container) {
    const {formatMessage} = this.props.intl
    const title = formatMessage(MESSAGES['fit-to-bounds'])
    const component = <i className='fa fa-map-marker' title={title} />
    ReactDOM.render(this.injectI18n(component), container)
  }

  renderSelectionControl () {
    const {mode, bufferSize, controlContainer} = this.state.selection
    const component = <MapSelectionControl
      mode={mode}
      modes={SELECTION_MODES}
      bufferSize={bufferSize}
      modeChange={this.selectionModeChangeHandler}
      bufferChange={this.bufferChangeHandler}
    />
    ReactDOM.render(this.injectI18n(component), controlContainer)
  }

  executeSelectionAction (list) {
    const {select, deselect} = this.props

    switch (this.state.selection.mode) {
      case SELECTION_MODES.select:
        select(list)
        break
      case SELECTION_MODES.deselect:
        deselect(list)
        break
    }
  }

  legendToggleHandler (key) {
    const {legend} = this.state
    legend[key] = !legend[key]
    this.setState({ legend: legend })
  }

  selectionModeChangeHandler (mode) {
    this.setState({selection: {...this.state.selection, mode}})
  }

  bufferChangeHandler (event) {
    L.DomEvent.stop(event)
    let value = parseInt(event.target.value, 10)
    if (value < 1) value = 1
    this.setState({selection: {...this.state.selection, bufferSize: value}})
  }

  injectI18n (component) {
    // we need to wrap it with IntlProvider to use i18n features
    const {locale, messages} = this.props.intl

    return (
      <IntlProvider locale={locale} messages={messages}>
        {component}
      </IntlProvider>
    )
  }
}

Map.propTypes = {
  highlightedItems: PropTypes.arrayOf(PropTypes.object),
  selectedItems: PropTypes.arrayOf(PropTypes.object),
  select: PropTypes.func,
  deselect: PropTypes.func,
  intl: intlShape.isRequired
}

export default injectIntl(Map)
