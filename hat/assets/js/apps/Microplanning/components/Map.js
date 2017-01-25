import React, {Component, PropTypes} from 'react'
import ReactDOM from 'react-dom'
import { FormattedMessage, IntlProvider, defineMessages, injectIntl, intlShape } from 'react-intl'
import L from 'leaflet'
import * as bz from '../../../utils/leaflet/box-zoom' // eslint-disable-line
import geoData from '../utils/geoData'
import {
  MapLegend,
  MapSelectionControl,
  MapSelectionList,
  MapTooltip
} from './index'

// map base layers (the `key` is the label used in the layers control)
const tileOptions = {keepBuffer: 4}
const baseLayers = {
  'Blank': L.tileLayer(''),
  'Open Street Map': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', tileOptions),
  'ArcGIS Street Map': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}.jpg', tileOptions),
  'ArcGIS Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.jpg', tileOptions),
  'ArcGIS Topo Map': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}.jpg', tileOptions)
}
// this is the default base layer, it should match one of the base layers keys
const DEFAULT_LAYER = 'ArcGIS Topo Map'

// maximum zoom used when fit to relevant markers
const MAX_ZOOM = 13

// circle size in metres depending on the village type
const RADIUS = {
  official: 350,
  other: 150,
  unknown: 150,
  highlight: 80, // amount to increase if there were cases
  buffer: 1 // default buffer value (1km)
}

const SELECTION_MODES = {
  none: 0,
  select: 1,
  deselect: -1
}

const MESSAGES = defineMessages({
  'fit-to-bounds': {
    defaultMessage: 'Center to relevant villages',
    id: 'microplanning.label.fitToBounds'
  },
  'screenshot-activate': {
    defaultMessage: 'Prepare to export/print current map view (fullscreen)',
    id: 'microplanning.label.screenshot.activate'
  },
  'screenshot-deactivate': {
    defaultMessage: 'Return to normal view',
    id: 'microplanning.label.screenshot.deactivate'
  },
  'boxzoom-title': {
    defaultMessage: 'Draw a square on the map to zoom in to an area',
    id: 'microplanning.label.boxzoom'
  },

  // custom layers
  'villages-labels': {
    defaultMessage: 'Village names',
    id: 'microplanning.label.villages.names'
  },
  'selected-villages': {
    defaultMessage: 'Selected villages',
    id: 'microplanning.label.villages.selected'
  }
})

class Map extends Component {
  constructor (props) {
    super(props)

    this.state = {
      // leaflet map object & layers
      map: null,
      layers: {
        // where to plot the selected markers
        selectedGroup: new L.FeatureGroup(),
        // where to plot ALL villages
        // in different groups based on type and use
        markersGroups: {
          map: new L.FeatureGroup(),
          official: new L.FeatureGroup(),
          other: new L.FeatureGroup(),
          unknown: new L.FeatureGroup()
        },
        shadowsGroups: {
          map: new L.FeatureGroup(),
          official: new L.FeatureGroup(),
          other: new L.FeatureGroup(),
          unknown: new L.FeatureGroup()
        },
        labelsGroups: {
          map: new L.FeatureGroup(),
          official: new L.FeatureGroup(),
          other: new L.FeatureGroup()
          // unknown: new L.FeatureGroup() // it's always `Inconnu`
        }
      },
      // options
      screenshot: false, // is ready to print/export?
      legend: { official: false, other: false, unknown: false },
      selection: {
        mode: SELECTION_MODES.none,
        bufferSize: RADIUS.buffer,
        highlightBufferSize: 0,
        highlightBufferGroup: new L.FeatureGroup(),
        controlContainer: null,
        marker: null
      }
    }

    this.legendToggleHandler = this.legendToggleHandler.bind(this)
    this.bufferChangeHandler = this.bufferChangeHandler.bind(this)
    this.selectionModeChangeHandler = this.selectionModeChangeHandler.bind(this)
    this.highlightBufferSizeHandler = this.highlightBufferSizeHandler.bind(this)
    this.selectHighlightWithBuffer = this.selectHighlightWithBuffer.bind(this)
    // capture keyboard events
    this.onKeyDown = this.onKeyDown.bind(this)
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
        this.updateSelectedItems()
      }

      // only call if selection object changed
      if (hasChanged(prevState, this.state, 'selection')) {
        this.updateSelectionMode()
      }

      // buffer zone around highlighted items
      this.updateBufferZone()

      // only call if screenshot option changed
      if (hasChanged(prevState, this.state, 'screenshot')) {
        this.renderSelectionControl()
        this.renderScreenshotControl()
      }
    })
  }

  componentWillUnmount () {
    if (this.state.map) {
      this.state.map.remove()
    }
  }

  render () {
    const {legend, selection, screenshot} = this.state
    const {selectedItems, deselect} = this.props

    const showSelectionList = (selection.mode !== SELECTION_MODES.none) || (selectedItems.length > 0)
    const mapClass = 'map__panel' +
      (screenshot ? '--fullscreen' : (showSelectionList ? '--left' : '')
    )

    let selectionList = ''
    if (!screenshot && showSelectionList) {
      selectionList = (
        <div className='map__panel--right'>
          <MapSelectionList
            data={selectedItems}
            show={(item) => this.openPopup(item, item._latlon)}
            deselect={deselect}
            highlightBufferSize={selection.highlightBufferSize}
            highlightBufferSizeChange={this.highlightBufferSizeHandler}
            selectHighlightWithBuffer={this.selectHighlightWithBuffer}
          />
        </div>
      )
    }

    return (
      <div className='widget__container' onKeyDown={this.onKeyDown}>
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

    // improves performance ???
    // http://leafletjs.com/reference.html#path-clip_padding
    L.Path.CLIP_PADDING = 0.5

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
    map.createPane('custom-pane-shapes')
    map.createPane('custom-pane-highlight-buffer')
    map.createPane('custom-pane-shadows')
    map.createPane('custom-pane-markers')
    map.createPane('custom-pane-highlight')
    map.createPane('custom-pane-selected')
    map.createPane('custom-pane-labels')
    map.createPane('custom-pane-buffer')

    // show metric scale
    L.control.scale({ imperial: false }).addTo(map)

    return map
  }

  includeControlsInMap (map) {
    // The order in which the controls are added matters
    const {formatMessage} = this.props.intl

    //
    // In TOP-LEFT
    // .- selection control
    // .- screenshot (prepare to print, fullscreen mode)
    // .- zoom control
    // .- box zoom
    // .- fit to bounds control
    // .- layers control (so far only for base tiles)
    //

    const topleftOptions = { position: 'topleft' }

    // control to `activate selection mode`
    const selectionControl = L.control(topleftOptions)
    selectionControl.onAdd = (map) => (L.DomUtil.create('div', 'hide-on-print'))
    selectionControl.addTo(map)
    this.state.selection.controlContainer = selectionControl.getContainer()

    // control to prepare `screenshot`
    const screenshotControl = L.control(topleftOptions)
    screenshotControl.onAdd = (map) => {
      const div = L.DomUtil.create('div', 'map__control__button leaflet-control hide-on-print')
      L.DomEvent.on(div, 'click', (event) => {
        L.DomEvent.stop(event)
        this.screenshotToggle()
        map.invalidateSize() // resize map
      })
      return div
    }
    screenshotControl.addTo(map)
    this.state.screenshotControl = screenshotControl.getContainer()
    this.renderScreenshotControl()

    // zoom control (standard)
    L.control.zoom(topleftOptions).addTo(map)
    L.Control.boxzoom({
      ...topleftOptions,
      title: formatMessage(MESSAGES['boxzoom-title'])
    }).addTo(map)

    // control to `fit to bounds`
    const fitToBoundsControl = L.control(topleftOptions)
    fitToBoundsControl.onAdd = (map) => {
      const div = L.DomUtil.create('div', 'map__control__button leaflet-control hide-on-print')
      div.title = formatMessage(MESSAGES['fit-to-bounds'])
      div.innerHTML = '<i class="fa fa-map-marker"></i>'
      L.DomEvent.on(div, 'click', (event) => {
        L.DomEvent.stop(event)
        this.fitToBounds()
      })
      return div
    }
    fitToBoundsControl.addTo(map)

    // layers control (standard)
    const {layers} = this.state
    const customLayers = {
      [formatMessage(MESSAGES['villages-labels'])]: layers.labelsGroups.map,
      [formatMessage(MESSAGES['selected-villages'])]: layers.selectedGroup
    }
    L.control.layers(baseLayers, customLayers, topleftOptions).addTo(map)

    //
    // In BOTTOM-RIGHT
    // .- tooltip
    //

    // control to visualize the layer, marker tooltip
    const tooltipControl = L.control({ position: 'bottomright' })
    tooltipControl.onAdd = (map) => (L.DomUtil.create('div', 'map__control__tooltip hide-on-print'))
    tooltipControl.addTo(map)
    this.state.tooltipContainer = tooltipControl.getContainer()

    return map
  }

  includeDefaultLayersInMap (map) {
    //
    // include relevant and fixed layers
    //
    const {layers} = this.state
    map.addLayer(layers.selectedGroup)
    map.addLayer(layers.markersGroups.map)
    map.addLayer(layers.shadowsGroups.map)
    map.addLayer(this.state.selection.highlightBufferGroup)

    //
    // plot the ALL boundaries
    //
    const plotOrHideLayer = (minZoom, type) => {
      const layer = shapes[type]
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
    const shapeOptions = (type) => ({
      pane: 'custom-pane-shapes',
      style: () => ({ className: String.raw`map-layer ${type}` }),
      onEachFeature: (feature, layer) => {
        const props = feature.properties
        this.addLayerEvents(layer, props)
      }
    })

    const shapes = {
      province: new L.FeatureGroup(),
      zone: new L.FeatureGroup(),
      area: new L.FeatureGroup()
    }
    // at which zoom can be displayed in map
    const zooms = {
      province: -1, // always in map
      zone: 7,
      area: 9
    }

    geoData.divisions.forEach((type) => {
      const shape = shapes[type]
      const data = geoData.data[type]
      const minZoom = zooms[type]

      shape.addLayer(L.geoJson(data, shapeOptions(type)))
      if (minZoom < 0) {
        map.addLayer(shape)
        this.state.defaultBounds = shape.getBounds()
      } else {
        L.DomEvent.on(map, 'zoomend', (event) => {
          plotOrHideLayer(minZoom, type)
        })
      }
    })

    //
    // create buffer selection circle around the mouse pointer
    //
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
    const {layers, items, legend} = this.state
    const {labelsGroups, markersGroups, shadowsGroups} = layers

    // plot indicated villages (active in legend)
    Object.keys(legend).forEach((key) => {
      const markers = markersGroups[key]
      const shadows = shadowsGroups[key]
      const labels = labelsGroups[key]

      if (force) {
        markers.clearLayers()
        shadows.clearLayers()
        if (labels) labels.clearLayers()
      }

      if (legend[key]) {
        // include layers
        if (!markersGroups.map.hasLayer(markers)) {
          markersGroups.map.addLayer(markers)
          shadowsGroups.map.addLayer(shadows)
          if (labels) labelsGroups.map.addLayer(labels)
        }

        // check if the layer has markers
        if (markers.getLayers().length === 0) {
          items
            .filter((item) => item.type === key)
            .forEach((item, index) => {
              const options = {
                className: String.raw`map-marker ${item._class}`,
                pane: String.raw`custom-pane-${item._pane}`,
                radius: item._radius
              }

              const marker = L.circle(item._latlon, options)
              this.addLayerEvents(marker, item)
              markers.addLayer(marker)

              // the label
              if (labels) {
                const label = L.marker(item._latlon, {
                  icon: L.divIcon({
                    className: '',
                    iconAnchor: [20, 20],
                    html: String.raw`<div class="map__marker__label ${key}">${item.village}</div>`
                  }),
                  pane: 'custom-pane-labels'
                })
                labels.addLayer(label)
              }

              if (item.confirmedCases > 0) {
                // the shadow
                const shadowOptions = {
                  className: 'map-marker shadow',
                  pane: 'custom-pane-shadows',
                  radius: (2 * item._radius)
                }
                const markerShadow = L.circle(item._latlon, shadowOptions)
                this.addLayerEvents(markerShadow, item)
                shadows.addLayer(markerShadow)
              }
            })
        }
      } else {
        // remove layers
        if (markersGroups.map.hasLayer(markers)) {
          markersGroups.map.removeLayer(markers)
          shadowsGroups.map.removeLayer(shadows)
          if (labels) labelsGroups.map.removeLayer(labels)
        }
      }
    })
  }

  updateSelectedItems () {
    const {selectedGroup} = this.state.layers
    const {selectedItems} = this.props

    selectedGroup.clearLayers()
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
      // in metres (buffer size = radius)
      marker.setRadius(bufferSize * 1000)
      this.state.map.addLayer(marker)
    } else {
      marker.setRadius(0)
      this.state.map.removeLayer(marker)
    }
  }

  updateBufferZone () {
    const {selectedItems} = this.props
    const {
      mode,
      highlightBufferSize,
      highlightBufferGroup
    } = this.state.selection

    highlightBufferGroup.clearLayers()

    // include buffer zone if selection mode is active
    // and there are no selected items yet
    if (mode && mode !== SELECTION_MODES.none &&
      selectedItems.length === 0 &&
      highlightBufferSize > 0) {
      const {items, legend} = this.state
      const highlight = items.filter((item) => legend[item.type] && item.confirmedCases > 0)
      const bufferSize = highlightBufferSize * 1000

      highlight.forEach((item) => {
        const options = {
          className: 'map-marker highlight-buffer',
          pane: 'custom-pane-highlight-buffer',
          radius: item._radius + bufferSize
        }

        const marker = L.circle(item._latlon, options)
        highlightBufferGroup.addLayer(marker)
      })
    }
  }

  updateScreenshotMode () {
    this.renderSelectionControl()
    this.renderScreenshotControl()
  }

  fitToBounds () {
    const {map, layers, defaultBounds} = this.state
    const {selectedGroup, shadowsGroups, markersGroups} = layers

    //
    // relevant order:
    //
    // 1. selected markers
    // 2. highlighted shadows
    // 3. official villages
    // 4. default bounds (provinces shape)
    // 5. default center and zoom
    //

    setTimeout(() => {
      if (selectedGroup.getBounds().isValid()) {
        map.fitBounds(selectedGroup.getBounds(), { maxZoom: MAX_ZOOM })
      } else if (shadowsGroups.map.getBounds().isValid()) {
        map.fitBounds(shadowsGroups.map.getBounds(), { maxZoom: MAX_ZOOM })
      } else if (markersGroups.map.hasLayer(markersGroups.official) &&
                 markersGroups.official.getBounds().isValid()) {
        map.fitBounds(markersGroups.official.getBounds(), { maxZoom: MAX_ZOOM })
      } else if (defaultBounds) {
        map.fitBounds(defaultBounds, { maxZoom: MAX_ZOOM })
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

  renderSelectionControl () {
    const {mode, bufferSize, controlContainer} = this.state.selection
    const {screenshot} = this.state
    if (!screenshot) {
      const component = <MapSelectionControl
        mode={mode}
        modes={SELECTION_MODES}
        bufferSize={bufferSize}
        modeChange={this.selectionModeChangeHandler}
        bufferChange={this.bufferChangeHandler}
      />
      ReactDOM.render(this.injectI18n(component), controlContainer)
    } else {
      // this is a workaround, instead of creating a new control
      // just reuse this one for the printer button
      const print = (
        <div className='map__banner'>
          <div className='map__control__button--printer hide-on-print' onClick={() => window.print()}>
            <i className='map__icon--printer' />
            <span className='text--center'>
              <FormattedMessage id='microplanning.label.print.info' defaultMessage='Click here or press «Ctrl+P» to print the map as it is.' />
              <br />
              <FormattedMessage id='microplanning.label.print.info' defaultMessage='Press «Esc» to return to normal view.' />
            </span>
          </div>
        </div>
      )
      ReactDOM.render(this.injectI18n(print), controlContainer)
    }
  }

  renderScreenshotControl () {
    const {formatMessage} = this.props.intl
    const {screenshot, screenshotControl} = this.state
    const component = (screenshot
      ? <i className='fa fa-compress' title={formatMessage(MESSAGES['screenshot-deactivate'])} />
      : <i className='fa fa-print' title={formatMessage(MESSAGES['screenshot-activate'])} />
    )
    ReactDOM.render(this.injectI18n(component), screenshotControl)
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

  highlightBufferSizeHandler (event) {
    L.DomEvent.stop(event)
    let value = parseInt(event.target.value, 10)
    if (value < 0) value = 0
    this.setState({selection: {...this.state.selection, highlightBufferSize: value}})
  }

  selectHighlightWithBuffer () {
    const {legend, items, map} = this.state
    const {select} = this.props
    const bufferSize = 1000 * this.state.selection.highlightBufferSize

    const plotted = items.filter((item) => legend[item.type])
    const length = plotted.length

    if (bufferSize === 0) {
      select(plotted.filter((item) => item.confirmedCases > 0))
      return
    }

    let inBuffer = []
    const bufferCircle = L.circle([0, 0], bufferSize)
    map.addLayer(bufferCircle)

    for (let i = 0; i < length; i++) {
      const itemA = plotted[i]
      if (itemA.confirmedCases > 0) {
        inBuffer.push(itemA)
      }

      // move and resize buffer circle
      const radius = itemA._radius + bufferSize
      bufferCircle._latlng = itemA._latlon
      bufferCircle.setRadius(radius)
      bufferCircle.redraw()

      const east = bufferCircle.getBounds().getEast()

      for (let j = i + 1; j < length; j++) {
        const itemB = plotted[j]

        // if the `longitude` is easter than the current position
        // then exit the loop
        if (itemB.longitude > east) break // exit the loop
        if (!itemA.confirmedCases && !itemB.confirmedCases) continue // ignore and continue

        // compare distance
        const distance = itemB._latlon.distanceTo(itemA._latlon)
        if (distance <= (radius + itemB._radius)) {
          if (itemA.confirmedCases) {
            inBuffer.push(itemB)
          } else {
            inBuffer.push(itemA)
          }
        }
      }
    }
    map.removeLayer(bufferCircle)

    select(inBuffer)
  }

  legendToggleHandler (key) {
    const {legend} = this.state
    this.setState({legend: {...legend, [key]: !legend[key]}})
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

  screenshotToggle (key) {
    const {screenshot} = this.state
    if (!screenshot) {
      // deactivate selection mode too
      this.setState({screenshot: !screenshot, selection: {...this.state.selection, mode: SELECTION_MODES.none}})
    } else {
      this.setState({screenshot: !screenshot})
    }
  }

  onKeyDown (event) {
    switch (event.keyCode) {
      case 27: // ESC
        // deactivate fullscreen and selection mode
        this.setState({
          screenshot: false,
          selection: {...this.state.selection, mode: SELECTION_MODES.none}
        })
        break
    }
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
