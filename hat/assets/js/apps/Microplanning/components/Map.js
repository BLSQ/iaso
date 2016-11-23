import React, {Component, PropTypes} from 'react'
import ReactDOM from 'react-dom'
import {IntlProvider, injectIntl, intlShape} from 'react-intl'
import L from 'leaflet'
import geoData from '../utils/geoData'
import {MapTooltip, DataSelected} from './index'

// map base layers (the `key` is the label used in the layers control)
const baseLayers = {
  'Blank': L.tileLayer(''),
  'Open Street Map': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
  'ArcGIS Street Map': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}.jpg'),
  'ArcGIS Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.jpg'),
  'ArcGIS Topo Map': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}.jpg')
}
// this is the default base layer, it should match one of the base layers keys
const DEFAULT_LAYER = 'Blank'

// circle size in metres depending on the village type
const RADIUS = {
  official: 350,
  other: 100,
  unknown: 100,
  highlight: 80 // amount to increase if there are cases
}

class Map extends Component {
  constructor (props) {
    super(props)

    this.state = {
      // leaflet map object
      map: null,
      // where to plot the selected, highlighted and buffer markers
      featureGroup: new L.FeatureGroup(),
      // where to plot ALL villages; different groups based on type
      markersGroup: {
        official: new L.FeatureGroup(),
        other: new L.FeatureGroup(),
        unknown: new L.FeatureGroup()
      },
      // selection mode is active or not
      inSelectionMode: false
    }
  }

  componentDidMount () {
    this.state.map = this.createMap()
    this.includeControlsInMap(this.state.map)
    this.includeDefaultLayersInMap(this.state.map)
  }
  componentDidUpdate () {
    this.state.map.whenReady(() => {
      this.updateMap()
    })
  }
  componentWillUnmount () {
    if (this.state.map) {
      this.state.map.remove()
    }
  }
  render () {
    const { selectedItems, unselect } = this.props
    const showSelection = this.state.inSelectionMode || selectedItems.length > 0

    if (!showSelection) {
      return (
        <div className=''>
          <div className='map__panel'>
            <div ref={(node) => (this.mapContainer = node)} className='map-container' />
          </div>
        </div>
      )
    }

    return (
      <div className=''>
        <div className='map__panel--left'>
          <div ref={(node) => (this.mapContainer = node)} className='map-container' />
        </div>
        <div className='map__panel--right'>
          <DataSelected
            data={selectedItems}
            show={(item) => this.openPopup(item, item._latlon)}
            unselect={unselect} />
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
      center: geoData.center,
      zoom: geoData.zoom
    })

    // add the default base layer
    baseLayers[DEFAULT_LAYER].addTo(map)

    // create panes (to preserve z-index order)
    map.createPane('custom-pane-layers')
    map.createPane('custom-pane-buffer')
    map.createPane('custom-pane-markers')

    // show metric scale
    L.control.scale({ imperial: false }).addTo(map)

    return map
  }

  includeControlsInMap (map) {
    // The order in which the controls are added matters
    //
    // In TOP-LEFT
    // 1.- fit to bounds control
    // 2.- selection control
    // 3.- layers control (so far only for base tiles)

    const commonOptions = {position: 'topleft'}

    // 1.- control to `fitToBounds`
    const fitToBoundsControl = L.control(commonOptions)
    fitToBoundsControl.onAdd = (map) => {
      const div = L.DomUtil.create('div', 'map__control--button')
      div.innerHTML = '<i class="fa fa-map-marker"></i>'
      L.DomEvent.on(div, 'click', (event) => {
        L.DomEvent.stop(event)
        this.fitToBounds()
      })

      return div
    }
    fitToBoundsControl.addTo(map)

    // 2.- control to `activate selection mode`
    const selectionModeControl = L.control(commonOptions)
    selectionModeControl.onAdd = (map) => {
      const div = L.DomUtil.create('div', 'map__control--button')
      div.innerHTML = '<i class="fa fa-bullseye"></i>'

      L.DomEvent.on(div, 'click', (event) => {
        L.DomEvent.stop(event)

        if (!this.state.inSelectionMode) {
          div.innerHTML = '<i class="fa fa-bullseye active"></i>'
        } else {
          div.innerHTML = '<i class="fa fa-bullseye"></i>'
        }

        this.setState({inSelectionMode: !this.state.inSelectionMode})
      })

      return div
    }
    selectionModeControl.addTo(map)

    // 3. layer control (standard)
    L.control.layers(baseLayers, null, commonOptions).addTo(map)

    return map
  }

  includeDefaultLayersInMap (map) {
    // include dynamic layer (highlight, selected, buffer...)
    map.addLayer(this.state.featureGroup)

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

  updateMap () {
    const {
      highlightedItems,
      selectedItems,
      filter,
      bufferSize,
      select,
      unselect
    } = this.props
    const {featureGroup} = this.state

    // reset previous state
    featureGroup.clearLayers()

    // plot indicated villages
    Object.keys(filter).forEach((key) => {
      this.plotVillagesByType(key, filter[key])
    })
    const plotted = geoData.villages.filter((item) => (filter[item.type]))

    if (highlightedItems && highlightedItems.length) {
      highlightedItems.forEach((item) => {
        const radius = RADIUS[item.type] + RADIUS.highlight
        const options = {
          pane: 'custom-pane-markers',
          radius: radius,
          className: 'map-marker highlight'
        }

        const marker = L.circle(item._latlon, options)
        this.addLayerEvents(marker, item)
        featureGroup.addLayer(marker)

        if (bufferSize > 0 && item.confirmedCases > 0) {
          // find out the points within the buffer zone
          // TO BE IMPROVED (quadratic)
          const inBuffer = plotted.filter((entry) => (
              item._id !== entry._id &&
              item._latlon.distanceTo(entry._latlon) <= (bufferSize + radius)
            ))
          inBuffer.push(item) // this has the info about cases
          const inSelection = selectedItems.filter((entry) => entry._id === item._id).length > 0

          // create buffer zone around the highlighted village
          const bufferZone = L.circle(item._latlon, {
            pane: 'custom-pane-buffer',
            radius: bufferSize,
            className: 'map-marker buffer'
          })
          featureGroup.addLayer(bufferZone)

          bufferZone.on({
            click: (event) => {
              L.DomEvent.stop(event)

              if (this.state.inSelectionMode) {
                if (inSelection) {
                  unselect(inBuffer)
                } else {
                  select(inBuffer)
                }
              }
            }
          })
        }
      })
    }

    if (selectedItems && selectedItems.length) {
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
        featureGroup.addLayer(marker)
      })
    }
  }

  fitToBounds () {
    const {map, featureGroup} = this.state
    setTimeout(() => {
      if (featureGroup.getLayers().length) {
        map.fitBounds(featureGroup.getBounds(), { maxZoom: 13 })
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
    const { select, unselect } = this.props

    layer.on({
      click: (event) => {
        L.DomEvent.stop(event)

        if (this.state.inSelectionMode) {
          if (item.isVillage) {
            (item.selected ? unselect([item]) : select([item]))
          }
        } else {
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
    ReactDOM.render(this.injectI18n(<MapTooltip item={item} />), div)

    this.state.map.openPopup(div, latlng, { minWidth: 200, maxWidth: 500 })
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
  filter: PropTypes.object,
  bufferSize: PropTypes.number,
  highlightedItems: PropTypes.arrayOf(PropTypes.object),
  selectedItems: PropTypes.arrayOf(PropTypes.object),
  select: PropTypes.func,
  unselect: PropTypes.func,
  intl: intlShape.isRequired
}

export default injectIntl(Map)
