/*
 * This component displays a leaflet map with all the layers, markers
 * and options indicated in the rest of components.
 */

import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import { FormattedMessage, IntlProvider, defineMessages, injectIntl, intlShape } from 'react-intl'
import Select from 'react-select';

import L from 'leaflet'
import * as zoomBar from './leaflet/zoom-bar' // eslint-disable-line

import geoUtils from '../utils/geo'
import MapTooltip from './MapTooltip'

// map base layers
const tileOptions = { keepBuffer: 4 }
const arcgisPattern = 'https://server.arcgisonline.com/ArcGIS/rest/services/{}/MapServer/tile/{z}/{y}/{x}.jpg'
const BASE_LAYERS = {
  'blank': L.tileLayer(''),
  'osm': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', tileOptions),
  'arcgis-street': L.tileLayer(arcgisPattern.replace('{}', 'World_Street_Map'), tileOptions),
  'arcgis-satellite': L.tileLayer(arcgisPattern.replace('{}', 'World_Imagery'), { ...tileOptions, maxZoom: 16 }),
  'arcgis-topo': L.tileLayer(arcgisPattern.replace('{}', 'World_Topo_Map'), { ...tileOptions, maxZoom: 17 })
}

const MESSAGES = defineMessages({
  'fit-to-bounds': {
    defaultMessage: 'Center to relevant villages',
    id: 'microplanning.label.fitToBounds'
  },
  'box-zoom-title': {
    defaultMessage: 'Draw a square on the map to zoom in to an area',
    id: 'microplanning.label.zoom.box'
  },
  'info-zoom-title': {
    defaultMessage: 'Current zoom level',
    id: 'microplanning.label.zoom.info'
  },
  'team-all': {
    defaultMessage: 'All teams',
    id: 'microplanning.label.team.all'
  }
})

class Map extends Component {
  constructor(props) {
    super(props)

    this.state = {
      map: null, // this is the leaflet object that represents the map
      containers: {},
      overlays: {},

      layers: {
        // where to plot the selected markers
        selectedGroup: new L.FeatureGroup(),
        highlightBufferGroup: new L.FeatureGroup(),
        mouseSelectionMarker: null, // buffer marker used to select villages
        chosenMarker: null, // marker used to bold the chosen item

        // where to plot ALL villages
        // split in different groups based on type and use
        markersGroups: {
          group: new L.FeatureGroup(),
          official: new L.FeatureGroup(),
          other: new L.FeatureGroup(),
          unknown: new L.FeatureGroup()
        },

        shadowsGroups: {
          group: new L.FeatureGroup(),
          official: new L.FeatureGroup(),
          other: new L.FeatureGroup(),
          unknown: new L.FeatureGroup()
        },

        labelsGroups: {
          group: new L.FeatureGroup(),
          official: new L.FeatureGroup(),
          other: new L.FeatureGroup()
          // unknown: new L.FeatureGroup() // it's always `Inconnu`
        }
      }
    }
  }

  componentDidMount() {
    this.createMap()
    this.includeControlsInMap()
    this.includeDefaultLayersInMap()
    this.updateBaseLayer()
    this.updateOverlays()
    this.fitToBounds()

    // return map object to parent
    // (it's needed to execute some leaflet operations)
    this.props.leafletMap(this.state.map)
  }

  componentDidUpdate(prevProps, prevState) {
    const { map } = this.state
    const hasChanged = (prev, curr, key) => (prev[key] !== curr[key])
    const sameVillage = (a, b) => geoUtils.areEqual(a, b, ['id', 'nr_positive_cases'])
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

    map.whenReady(() => {
      // only call if base layer changed
      if (hasChanged(prevProps, this.props, 'baseLayer')) {
        this.updateBaseLayer()
      }

      // only call if one of the overlays changed
      if (hasChanged(prevProps, this.props, 'overlays')) {
        this.updateOverlays()
      }

      // only call if legend or items changed
      if (!containSameItems(prevProps, this.props, 'items')) {
        this.updateItems(true)
      } else if (hasChanged(prevProps, this.props, 'legend')) {
        this.updateItems()
      }

      // only call if the number of selected items changed
      if (!containSameItems(prevProps, this.props, 'selectedItems')) {
        this.updateSelectedItems()
      }

      // only call if fullscreen option changed
      if (hasChanged(prevProps, this.props, 'fullscreen')) {
        this.updateFullscreenMode()
      }

      // show/hide tooltip
      if (hasChanged(prevProps, this.props, 'chosenItem')) {
        this.updateTooltipLarge()
      }

      this.updateMouseBuffer()
      this.updateHighlightBuffer()
    })
  }

  componentWillUnmount() {
    if (this.state.map) {
      this.state.map.remove()
    }
  }

  render() {
    return <div ref={(node) => (this.state.containers.map = node)} className='map-container' />
  }

  /* ***************************************************************************
   * CREATE MAP
   ****************************************************************************/

  createMap() {
    const map = L.map(this.state.containers.map, {
      attributionControl: false,
      zoomControl: false, // zoom control will be added manually
      scrollWheelZoom: false, // disable scroll zoom
      center: geoUtils.center,
      zoom: geoUtils.zoom
    })

    // create panes to preserve z-index order
    map.createPane('custom-pane-shapes')
    map.createPane('custom-pane-highlight-buffer')
    map.createPane('custom-pane-shadows')
    map.createPane('custom-pane-markers')
    map.createPane('custom-pane-highlight')
    map.createPane('custom-pane-selected')
    map.createPane('custom-pane-labels')
    map.createPane('custom-pane-buffer')

    this.state.map = map
  }

  includeControlsInMap() {
    // The order in which the controls are added matters
    const { formatMessage } = this.props.intl
    const { map, containers } = this.state

    //
    // In TOP-LEFT
    // .- zoom bar
    //
    // In TOP-RIGHT
    // .- fullscreen warning
    //
    // In BOTTOM-RIGHT
    // .- metric scale
    //
    // In BOTTOM-LEFT
    // .- tooltip-small
    // .- tooltip-large
    //

    // zoom bar control
    L.control.zoombar({
      zoomBoxTitle: formatMessage(MESSAGES['box-zoom-title']),
      zoomInfoTitle: formatMessage(MESSAGES['info-zoom-title']),
      fitToBoundsTitle: formatMessage(MESSAGES['fit-to-bounds']),
      fitToBounds: () => { this.fitToBounds() },
      position: 'topleft'
    }).addTo(map)

    // control to visualize warnings
    const warningControl = L.control({ position: 'topright' })
    warningControl.onAdd = () => (L.DomUtil.create('div', 'hide-on-print'))
    warningControl.addTo(map)
    containers.warning = warningControl.getContainer()

    // metric scale
    L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map)

    // controls to visualize the shape/marker tooltip
    const tooltipSmallControl = L.control({ position: 'bottomleft' })
    tooltipSmallControl.onAdd = () => L.DomUtil.create('div', 'map__control__tooltip hide-on-print')
    tooltipSmallControl.addTo(map)
    containers.tooltipSmall = tooltipSmallControl.getContainer()

    const tooltipLargeControl = L.control({ position: 'bottomleft' })
    tooltipLargeControl.onAdd = () => L.DomUtil.create('div', 'map__control__tooltip hide-on-print')
    tooltipLargeControl.addTo(map)
    containers.tooltipLarge = tooltipLargeControl.getContainer()
  }

  includeDefaultLayersInMap() {
    //
    // include relevant and constant layers
    //

    const { map, layers, overlays } = this.state
    map.addLayer(layers.selectedGroup)
    map.addLayer(layers.markersGroups.group)
    map.addLayer(layers.shadowsGroups.group)
    map.addLayer(layers.highlightBufferGroup)

    // assign labels overlay using the existent labels group
    overlays.labels = layers.labelsGroups.group

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
        this.addLayerEvents(layer, feature.properties)
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

    geoUtils.divisions.forEach((type) => {
      const shape = shapes[type]
      const data = geoUtils.data[type]
      const minZoom = zooms[type]

      shape.addLayer(L.geoJson(data, shapeOptions(type)))
      if (minZoom < 0) {
        // province divisions are always visible and are use as default bounds
        map.addLayer(shape)
        this.state.defaultBounds = shape.getBounds()
      } else {
        L.DomEvent.on(map, 'zoomend', (event) => {
          plotOrHideLayer(minZoom, type)
        })
      }
    })

    //
    // create buffer circle around the mouse pointer
    //
    const bufferMarker = L.circle(map.getCenter(), {
      className: 'map-marker buffer',
      pane: 'custom-pane-buffer',
      radius: 0
    })
    layers.mouseSelectionMarker = bufferMarker

    bufferMarker.on({
      click: (event) => {
        L.DomEvent.stop(event)
        const { legend, items } = this.props
        const plotted = items.filter((item) => legend[item.type])
        const inBuffer = geoUtils.villagesInBuffer(plotted, bufferMarker)

        if (inBuffer.length) {
          this.props.selectionAction(inBuffer)
        }
      }
    })

    // chase the mouse...
    map.on('mousemove', (event) => {
      // circle needs to be in the map or `setLatLng` will fail
      // https://github.com/Leaflet/Leaflet/issues/4629
      if (map.hasLayer(bufferMarker)) {
        bufferMarker.setLatLng(event.latlng)
      }
    })

    // create marker for the chosen item
    const chosenMarker = L.circle(map.getCenter(), {
      className: 'map-marker chosen',
      pane: 'custom-pane-selected',
      radius: 0
    })
    layers.chosenMarker = chosenMarker
  }

  /* ***************************************************************************
   * UPDATE STATE
   ****************************************************************************/

  updateBaseLayer() {
    const { baseLayer } = this.props
    const { map } = this.state

    Object.keys(BASE_LAYERS).forEach((key) => {
      const layer = BASE_LAYERS[key]
      if (key === baseLayer) {
        layer.addTo(map)
      } else if (map.hasLayer(layer)) {
        map.removeLayer(layer)
      }
    })
  }

  updateOverlays() {
    const { map } = this.state

    Object.keys(this.props.overlays).forEach((key) => {
      const active = this.props.overlays[key]
      const layer = this.state.overlays[key]
      if (active && !map.hasLayer(layer)) {
        layer.addTo(map)
      } else if (!active && map.hasLayer(layer)) {
        map.removeLayer(layer)
      }
    })
  }

  updateItems(force) {
    const { legend, items } = this.props
    const { layers } = this.state
    const { labelsGroups, markersGroups, shadowsGroups } = layers

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
        // include layers in group
        if (!markersGroups.group.hasLayer(markers)) {
          markersGroups.group.addLayer(markers)
          shadowsGroups.group.addLayer(shadows)
          if (labels) labelsGroups.group.addLayer(labels)
        }

        // check if the layer has markers
        if (markers.getLayers().length === 0) {
          items
            // .filter((item) => item.type === key)
            .forEach((item, index) => {
              // console.log(item);
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
                    html: String.raw`<div className="map__marker__label ${key}">${item.village}</div>`
                  }),
                  pane: 'custom-pane-labels'
                })
                labels.addLayer(label)
              }

              if (item._isHighlight) {
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
        // remove layers from group
        if (markersGroups.group.hasLayer(markers)) {
          markersGroups.group.removeLayer(markers)
          shadowsGroups.group.removeLayer(shadows)
          if (labels) labelsGroups.group.removeLayer(labels)
        }
      }
    })
  }

  updateSelectedItems() {
    const { selectedItems } = this.props
    const { selectedGroup } = this.state.layers

    selectedGroup.clearLayers()
    selectedItems.forEach((item) => {
      const options = {
        className: 'map-marker selected',
        pane: 'custom-pane-selected',
        radius: item._radius
      }

      const marker = L.circle(item._latlon, options)
      this.addLayerEvents(marker, { ...item, selected: true })
      selectedGroup.addLayer(marker)
    })
  }

  updateMouseBuffer() {
    const { bufferSize } = this.props
    const { map } = this.state
    const { mouseSelectionMarker } = this.state.layers

    if (bufferSize > 0) {
      // in metres (buffer size = radius)
      mouseSelectionMarker.setRadius(bufferSize * 1000)
      map.addLayer(mouseSelectionMarker)
    } else {
      mouseSelectionMarker.setRadius(0)
      map.removeLayer(mouseSelectionMarker)
    }
  }

  updateHighlightBuffer() {
    const { legend, highlightBufferSize } = this.props
    const { highlightBufferGroup } = this.state.layers

    highlightBufferGroup.clearLayers()

    // include buffer zone
    if (highlightBufferSize > 0) {
      const { items } = this.props
      const highlight = items.filter((item) => legend[item.type] && item._isHighlight)
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

  updateFullscreenMode() {
    const { fullscreen } = this.props
    const { map } = this.state
    const { warning } = this.state.containers

    warning.innerHTML = ''
    if (fullscreen) {
      const printButton = (
        <div className='map__control__button--printer' onClick={() => window.print()}>
          <i className='map__icon--printer' />
          <span className='text--center'>
            <FormattedMessage id='microplanning.label.print.info' defaultMessage='Hit here or press «Ctrl+P» to print the map.' />
            <br />
            <FormattedMessage id='microplanning.label.print.esc' defaultMessage='Press «Esc» to return to normal view.' />
          </span>
        </div>
      )
      ReactDOM.render(this.injectI18n(printButton), warning)
    }

    // resize map
    map.invalidateSize()
  }

  updateTooltipSmall(item) {
    if (!this.props.chosenItem && item) {
      this.state.containers.tooltipSmall.innerHTML = item.label
    } else {
      this.state.containers.tooltipSmall.innerHTML = ''
    }
  }

  updateTooltipLarge() {
    const { map } = this.state
    const { tooltipSmall, tooltipLarge } = this.state.containers
    const { chosenMarker } = this.state.layers
    const { chosenItem, showItem, legend, items } = this.props
    const team = null
    const { formatMessage } = this.props.intl;

    // clean previous
    tooltipLarge.innerHTML = ''
    if (map.hasLayer(chosenMarker)) {
      chosenMarker.setRadius(0)
      map.removeLayer(chosenMarker)
    }

    if (!chosenItem) {
      return
    }
    const item = (!chosenItem.village
      ? geoUtils.extendDivisionInfo(chosenItem, items, legend)
      : chosenItem
    )

    if (item._latlon) {
      map.addLayer(chosenMarker)
      chosenMarker.setRadius(item._radius - 10)
      chosenMarker.setLatLng(item._latlon)
      map.panTo(item._latlon)
    }

    const tootltip = (
      <div>
        <div onClick={() => showItem()} className='map__tooltip--close'>
          <FormattedMessage id='microplanning.label.close' defaultMessage='close' />
          &nbsp;
          <i className='fa fa-close' />
        </div>
        <div className="map__tooltip">
          <div className="property">
            <Select
              simpleValue
              autosize={false}
              name='teams'
              value={team || ''}
              placeholder={formatMessage(MESSAGES['team-all'])}
              options={this.props.teams.map((value) => ({ label: value[1], value: value[1] }))}
              onChange={teams => this.props.redirect({ ...this.props.params, teams })}
            />
          </div>
        </div>
        <MapTooltip item={item} />
      </div>
    )
    ReactDOM.render(this.injectI18n(tootltip), tooltipLarge)
    tooltipSmall.innerHTML = ''
  }

  /* ***************************************************************************
   * ACTIONS
   ****************************************************************************/

  fitToBounds() {
    const { map, layers, defaultBounds } = this.state
    const { selectedGroup, shadowsGroups, markersGroups } = layers
    // maximum zoom allowed to fit to relevant markers
    const MAX_ZOOM = 13

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
      } else if (shadowsGroups.group.getBounds().isValid()) {
        map.fitBounds(shadowsGroups.group.getBounds(), { maxZoom: MAX_ZOOM })
      } else if (markersGroups.group.hasLayer(markersGroups.official) &&
        markersGroups.official.getBounds().isValid()) {
        map.fitBounds(markersGroups.official.getBounds(), { maxZoom: MAX_ZOOM })
      } else if (defaultBounds) {
        map.fitBounds(defaultBounds, { maxZoom: MAX_ZOOM })
      } else {
        map.setView(geoUtils.center, geoUtils.zoom)
      }
      map.invalidateSize()
    }, 1)
  }

  /* ***************************************************************************
   * HELPERS
   ****************************************************************************/

  addLayerEvents(layer, item) {
    // layer.bindTooltip(item.label, {sticky: true})
    layer.on({
      click: (event) => {
        L.DomEvent.stop(event)
        this.props.showItem(item)
      },
      contextmenu: (event) => {
        L.DomEvent.stop(event)
        this.props.showItem(item)
      },
      mouseover: (event) => {
        L.DomEvent.stop(event)
        this.updateTooltipSmall(item)
      },
      mouseout: (event) => {
        L.DomEvent.stop(event)
        this.updateTooltipSmall()
      }
    })
  }

  injectI18n(component) {
    // we need to wrap it with `IntlProvider` to use i18n features
    const { locale, messages } = this.props.intl

    return (
      <IntlProvider locale={locale} messages={messages}>
        {component}
      </IntlProvider>
    )
  }
}

Map.propTypes = {
  baseLayer: PropTypes.string,
  overlays: PropTypes.object,
  legend: PropTypes.object,
  fullscreen: PropTypes.bool,
  items: PropTypes.arrayOf(PropTypes.object),
  selectedItems: PropTypes.arrayOf(PropTypes.object),
  bufferSize: PropTypes.number,
  highlightBufferSize: PropTypes.number,
  selectionAction: PropTypes.func,
  chosenItem: PropTypes.object,
  showItem: PropTypes.func,
  leafletMap: PropTypes.func,
  intl: intlShape.isRequired,
  teams: PropTypes.arrayOf(PropTypes.array)
}

export default injectIntl(Map)
