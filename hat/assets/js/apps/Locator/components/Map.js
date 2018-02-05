/*
 * This component displays a leaflet map with all the layers, markers
 * and options indicated in the rest of components.
 */

import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import { FormattedMessage, IntlProvider, defineMessages, injectIntl, intlShape } from 'react-intl'
import Select from 'react-select';
import geoUtils from '../../Microplanning/utils/geo'
import L from 'leaflet'
import * as zoomBar from '../../Microplanning/components/leaflet/zoom-bar' // eslint-disable-line


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
    id: 'locator.label.fitToBounds'
  },
  'box-zoom-title': {
    defaultMessage: 'Draw a square on the map to zoom in to an area',
    id: 'locator.label.zoom.box'
  },
  'info-zoom-title': {
    defaultMessage: 'Current zoom level',
    id: 'locator.label.zoom.info'
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
        villages: new L.FeatureGroup(),
        chosenMarker: null, // marker used to bold the chosen item
      }
    }
  }

  componentDidMount() {
    this.createMap()
    this.includeControlsInMap()
    this.includeDefaultLayersInMap()
    this.updateBaseLayer()
    this.fitToBounds()
  }

  componentDidUpdate(prevProps, prevState) {
    const { map } = this
    const hasChanged = (prev, curr, key) => (prev[key] !== curr[key])

    map.whenReady(() => {
      // only call if base layer changed
      if (hasChanged(prevProps, this.props, 'baseLayer')) {
        this.updateBaseLayer()
      }

      // only call if one of the overlays changed
      if (hasChanged(prevProps, this.props, 'overlays')) {
        this.updateOverlays()
      }
      this.updateItems(true)



      // show/hide tooltip
      if (hasChanged(prevProps, this.props, 'chosenItem')) {
        this.updateTooltipLarge()
      }

    })
  }

  componentWillUnmount() {
    if (this.map) {
      this.map.remove()
    }
  }

  render() {
    return <div ref={(node) => (this.mapNode = node)} className='map-container' />
  }

  /* ***************************************************************************
   * CREATE MAP
   ****************************************************************************/

  createMap() {
    const map = L.map(this.mapNode, {
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
    this.map = map
  }

  includeControlsInMap() {
    // The order in which the controls are added matters
    const { formatMessage } = this.props.intl
    const {  containers } = this.state
    const { map} = this
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
    const { map } = this
    const { layers, overlays } = this.state
    this.villageGroup = new L.FeatureGroup()
    map.addLayer(this.villageGroup)
    // assign labels overlay using the existent labels group

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
    const { map } = this

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
    const { map } = this

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
    const villages = this.props.villages

    this.villageGroup.clearLayers()
    if (villages) {
      villages.map(village => {
        const color = this.props.selectedVillageId && village.id === this.props.selectedVillageId ? '#FF3824' : '#00f';
        const fillColor = this.props.selectedVillageId && village.id === this.props.selectedVillageId ? '#FF0C6C' : '#30b';
        var villageCircle = L.circle([village.latitude, village.longitude], {
          color,
          fillColor,
          fillOpacity: 0.5,
          radius: 500,
          pane: 'custom-pane-markers'
        }).addTo(this.villageGroup).on('click', () => {
          this.props.selectVillage(village.id)
        });
      })
    }
  }

  updateTooltipSmall(item) {
    if (!this.props.chosenItem && item) {
      this.state.containers.tooltipSmall.innerHTML = item.label
    } else {
      this.state.containers.tooltipSmall.innerHTML = ''
    }
  }



  /* ***************************************************************************
   * ACTIONS
   ****************************************************************************/

  fitToBounds() {
    const { map} = this

    // maximum zoom allowed to fit to relevant markers
    const MAX_ZOOM = 13


    setTimeout(() => {
      let bounds = this.villageGroup.getBounds()
      if (bounds.isValid()) {
        map.fitBounds(bounds, { maxZoom: MAX_ZOOM })
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
      },
      contextmenu: (event) => {
        L.DomEvent.stop(event)
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
  villages: PropTypes.arrayOf(PropTypes.object),
  selectionAction: PropTypes.func,
  chosenItem: PropTypes.object,
  intl: intlShape.isRequired,
  selectVillage: PropTypes.func,
  selectedVillageId: PropTypes.number
}

export default injectIntl(Map)
