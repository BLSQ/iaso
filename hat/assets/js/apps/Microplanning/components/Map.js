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
  buffer: 1 // default buffer value (1km)
}

const SELECTION_MODES = {
  none: 0,
  select: 1,
  deselect: -1
}

const MESSAGES = defineMessages({
  'fit-to-bounds': {
    defaultMessage: 'center to selected villages',
    id: 'microplanning.label.fitToBounds'
  }
})

class Map extends Component {
  constructor (props) {
    super(props)

    this.state = {
      // leaflet map object
      map: null,
      // where to plot the selected markers
      selectedGroup: new L.FeatureGroup(),
      // where to plot ALL boundaries; in different groups based on type
      layersGroups: {
        provinces: new L.FeatureGroup(),
        zones: new L.FeatureGroup(),
        areas: new L.FeatureGroup()
      },
      // where to plot ALL villages; in different groups based on type
      markersGroups: {
        official: new L.FeatureGroup(),
        other: new L.FeatureGroup(),
        unknown: new L.FeatureGroup()
      },
      legend: { official: false, other: false, unknown: false },
      selection: {
        mode: SELECTION_MODES.none,
        bufferSize: RADIUS.buffer,
        controlContainer: null,
        marker: null
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

    this.state.items = this.getItems()
    this.legendToggleHandler('official') // plot official villages
    this.selectionModeChangeHandler(SELECTION_MODES.none) // no selection mode

    this.fitToBounds()
  }

  componentDidUpdate (prevProps, prevState) {
    const hasChanged = (prev, curr, key) => (prev[key] !== curr[key])
    const sameVillage = (a, b) => geoData.areEqual(a, b, ['id', 'confirmedCases'])
    const containSameItems = (prev, curr, key) => {
      if (!hasChanged(prev, curr, key)) return true
      const arr1 = prev[key]
      const arr2 = curr[key]
      const length = arr1.length
      if (length !== arr2.length) return false
      for (let i = 0; i < length; i++) {
        if (!sameVillage(arr1[i], arr2[i])) {
          return false
        }
      }
      return true
    }

    this.state.map.whenReady(() => {
      // only call if legend or items changed
      if (!containSameItems(prevProps, this.props, 'items')) {
        this.state.items = this.getItems()
        this.updateItems(true)
      } else if (hasChanged(prevState, this.state, 'legend')) {
        this.updateItems()
      }

      // only call if the number of selected items changed
      if (!containSameItems(prevProps, this.props, 'selectedItems')) {
        this.state.selectedGroup.clearLayers()
        this.updateSelectedItems()
      }

      // only call if selection object changed
      if (hasChanged(prevState, this.state, 'selection')) {
        this.updateSelectionMode()
      }
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
            <FormattedMessage id='microplanning.datasource.pharmacovigilance' defaultMessage='Pharmacovigilance' />,&nbsp;
            <FormattedMessage id='microplanning.datasource.pnltha.2015' defaultMessage='PNLTHA data (2015)' />
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
    map.createPane('custom-pane-highlight')
    map.createPane('custom-pane-selected')
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
    //

    const topleftOptions = { position: 'topleft' }

    // control to `activate selection mode`
    const selectionControl = L.control(topleftOptions)
    selectionControl.onAdd = (map) => (L.DomUtil.create('div'))
    selectionControl.addTo(map)
    this.state.selection.controlContainer = selectionControl.getContainer()

    // zoom control (standard)
    L.control.zoom(topleftOptions).addTo(map)

    // control to `fit to bounds`
    const fitToBoundsControl = L.control(topleftOptions)
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

    // layers control (standard)
    L.control.layers(baseLayers, null, topleftOptions).addTo(map)

    //
    // In BOTTOM-RIGHT
    // 1.- tooltip
    //

    // control to visualize the layer, marker tooltip
    const tooltipControl = L.control({ position: 'bottomright' })
    tooltipControl.onAdd = (map) => (L.DomUtil.create('div', 'map__control__tooltip'))
    tooltipControl.addTo(map)
    this.state.tooltipContainer = tooltipControl.getContainer()

    return map
  }

  includeDefaultLayersInMap (map) {
    const plotOrHideLayer = (minZoom, layer) => {
      if (map.getZoom() > minZoom) {
        if (!map.hasLayer(layer)) {
          map.addLayer(layer)
        }
      } else {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer)
        }
      }
    }

    // include selected items layer
    map.addLayer(this.state.selectedGroup)

    const shapeOptions = {
      pane: 'custom-pane-layers',
      style: () => ({ className: 'map-layer transparent' }),
      onEachFeature: (feature, layer) => {
        this.addLayerEvents(layer, feature.properties)
      }
    }

    // plot the ALL boundaries
    const {provinces, zones, areas} = this.state.layersGroups
    provinces.addLayer(L.geoJson(geoData.provinces, shapeOptions))
    zones.addLayer(L.geoJson(geoData.zones, shapeOptions))
    areas.addLayer(L.geoJson(geoData.areas, shapeOptions))

    plotOrHideLayer(-1, provinces)
    L.DomEvent.on(map, 'zoomend', (event) => {
      plotOrHideLayer(7, zones)
      plotOrHideLayer(9, areas)
    })

    this.state.defaultBounds = provinces.getBounds()

    // create buffer selection circle around the mouse pointer
    const bufferMarker = L.circle(map.getCenter(), {
      className: 'map-marker buffer',
      pane: 'custom-pane-buffer',
      radius: 0
    })
    this.state.selection.marker = bufferMarker

    bufferMarker.on({
      click: (event) => {
        L.DomEvent.stop(event)
        const {legend, items} = this.state
        const plotted = items.filter((item) => legend[item.type])
        const bufferRadius = bufferMarker.getRadius()

        // find out the points within the buffer zone
        const length = plotted.length
        const bounds = bufferMarker.getBounds()
        const west = bounds.getWest()
        const east = bounds.getEast()

        let inBuffer = []
        for (let i = 0; i < length; i++) {
          // the items are ordered by `longitude`

          // compare `longitude` with west and east
          // if the `longitude` is easter than the current position
          // then exit the loop
          const entry = plotted[i]
          if (entry.longitude < west) continue // ignore and continue
          if (entry.longitude > east) break // exit the loop

          // compare distance
          const distance = event.latlng.distanceTo(entry._latlon)
          if (distance <= (bufferRadius + entry._radius)) {
            inBuffer.push(entry)
          }
        }

        this.executeSelectionAction(inBuffer)
      }
    })

    // chase the mouse...
    map.on('mousemove', (event) => {
      // fires exception `undefined`
      // bufferMarker.setLatLng(event.latlng)
      // workaround
      bufferMarker._latlng = L.latLng(event.latlng)
      bufferMarker.redraw()
    })

    return map
  }

  getItems () {
    return this.props.items
      .map((item) => {
        const _latlon = L.latLng(item.latitude, item.longitude)
        // take size from village type and increase it if there are cases
        const _radius = RADIUS[item.type] +
          ((item.confirmedCases > 0) ? RADIUS.highlight : 0)
        const _class = ((item.confirmedCases > 0) ? 'highlight' : item.type)
        const _pane = ((item.confirmedCases > 0) ? 'highlight' : 'markers')

        return {...item, _radius, _class, _pane, _latlon}
      })
  }

  updateItems (force) {
    const { map, markersGroups, items, legend } = this.state

    // plot indicated villages (active in legend)
    Object.keys(legend).forEach((key) => {
      const layer = markersGroups[key]

      if (force) {
        layer.clearLayers()
      }

      if (legend[key]) {
        // include layer
        if (!map.hasLayer(layer)) map.addLayer(layer)

        // check if the layer has markers
        if (layer.getLayers().length === 0) {
          items
            .filter((item) => item.type === key)
            .forEach((item, index) => {
              const options = {
                className: 'map-marker ' + item._class,
                pane: 'custom-pane-' + item._pane,
                radius: item._radius
              }

              const marker = L.circle(item._latlon, options)
              this.addLayerEvents(marker, item)
              layer.addLayer(marker)

              if (item.confirmedCases > 0) {
                // the shadow
                const shadowOptions = {
                  className: 'map-marker shadow',
                  pane: 'custom-pane-shadows',
                  radius: (2 * item._radius)
                }
                const markerShadow = L.circle(item._latlon, shadowOptions)
                this.addLayerEvents(markerShadow, item)
                layer.addLayer(markerShadow)
              }
            })
        }
      } else {
        // remove layer
        if (map.hasLayer(layer)) {
          map.removeLayer(layer)
        }
      }
    })
  }

  updateSelectedItems () {
    const { selectedGroup } = this.state
    const { selectedItems } = this.props

    selectedItems.forEach((item) => {
      const options = {
        className: 'map-marker selected',
        pane: 'custom-pane-selected',
        radius: item._radius
      }

      const marker = L.circle(item._latlon, options)
      this.addLayerEvents(marker, {...item, selected: true})
      selectedGroup.addLayer(marker)
    })
  }

  updateSelectionMode () {
    const {mode, bufferSize, marker} = this.state.selection

    this.renderSelectionControl()

    if (mode && mode !== SELECTION_MODES.none && bufferSize > 0) {
      // in metres (buffer size = diameter = 2 * radius)
      marker.setRadius(bufferSize * 500)
      this.state.map.addLayer(marker)
    } else {
      marker.setRadius(0)
      this.state.map.removeLayer(marker)
    }
  }

  fitToBounds () {
    const {map, selectedGroup, markersGroups, defaultBounds} = this.state
    const layer = markersGroups.official

    setTimeout(() => {
      if (selectedGroup.getLayers().length) {
        map.fitBounds(selectedGroup.getBounds(), { maxZoom: 13 })
      } else if (map.hasLayer(layer) && layer.getLayers().length) {
        map.fitBounds(layer.getBounds())
      } else if (defaultBounds) {
        map.fitBounds(defaultBounds)
      } else {
        map.setView(geoData.center, geoData.zoom)
      }
      map.invalidateSize()
    }, 1)
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
      },
      mouseover: (event) => {
        L.DomEvent.stop(event)
        this.state.tooltipContainer.innerHTML = item.label
      },
      mouseout: (event) => {
        L.DomEvent.stop(event)
        this.state.tooltipContainer.innerHTML = ''
      }
    })
  }

  openPopup (item, latlng) {
    const div = L.DomUtil.create('div')
    let entry = item

    if (!item.village) {
      const {items, legend} = this.state
      const condition = (entry) => geoData.areEqual(item, entry, item._keys)
      const count = (filter) => (prev, curr) => (prev + (filter(curr) ? 1 : 0))
      const sum = (key) => (prev, curr) => (prev + (curr[key] || 0))
      const max = (key) => (prev, curr) => (!curr[key] || prev >= curr[key] ? prev : curr[key])

      // find the items in shape and the plotted ones
      const inShape = items.filter(condition)
      const plotted = inShape.filter((entry) => legend[entry.type])

      // find out the number of cases and the onset date of the last case
      const confirmedCases = plotted.reduce(sum('confirmedCases'), 0)
      const screenedPeople = plotted.reduce(sum('screenedPeople'), 0)
      const lastConfirmedCaseDate = plotted.reduce(max('lastConfirmedCaseDate'), '')
      const lastScreeningDate = plotted.reduce(max('lastScreeningDate'), '')

      // find out the population and number of villages by type
      const population = inShape.reduce(sum('population'), 0)
      const villagesOfficial = inShape.reduce(count((entry) => (entry.type === 'official')), 0)
      const villagesOther = inShape.reduce(count((entry) => (entry.type === 'other')), 0)
      const villagesUnknown = inShape.reduce(count((entry) => (entry.type === 'unknown')), 0)

      entry = {
        ...item,
        confirmedCases,
        lastConfirmedCaseDate,
        screenedPeople,
        lastScreeningDate,
        population,
        villagesOfficial,
        villagesOther,
        villagesUnknown
      }
    }

    ReactDOM.render(this.injectI18n(
      <div>
        <div onClick={() => this.state.map.closePopup()} className='popup-close-button'>
          <i className='fa fa-close' />&nbsp;
          <FormattedMessage id='microplanning.popup.close' defaultMessage='close' />
        </div>
        <MapTooltip item={entry} />
      </div>
    ), div)
    this.state.map.openPopup(div, latlng, { closeButton: false, minWidth: 200, maxWidth: 500 })
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
    this.setState({ legend: {...legend, [key]: !legend[key]} })
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
  items: PropTypes.arrayOf(PropTypes.object),
  selectedItems: PropTypes.arrayOf(PropTypes.object),
  select: PropTypes.func,
  deselect: PropTypes.func,
  intl: intlShape.isRequired
}

export default injectIntl(Map)
