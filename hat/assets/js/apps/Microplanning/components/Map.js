import React, {Component, PropTypes} from 'react'
import ReactDOM from 'react-dom'
import {IntlProvider, injectIntl, intlShape} from 'react-intl'
import L from 'leaflet'
import geoData from '../utils/geoData'
import {default as MapTooltip} from './MapTooltip'
import {default as DataSelected} from './DataSelected'

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
  highlight: 80
}

class Map extends Component {
  componentDidMount () {
    this.createMap()
    this.includeControls()
    this.includeLayersAndMarkers()
  }
  componentDidUpdate () {
    this.map.whenReady(() => {
      this.updateMap()
    })
    this.updateSelectionPanel()
  }
  componentWillUnmount () {
    if (this.map) {
      this.map.remove()
    }
  }
  render () {
    return <div ref={(node) => (this.container = node)} className='map-container' />
  }

  createMap () {
    const node = ReactDOM.findDOMNode(this)

    // HACK: Work around for testing Leaflet in JSDOM
    // see: https://github.com/Leaflet/Leaflet/issues/4823
    if (!node.clientWidth && !node.clientHeight) {
      node.clientHeight = 720
      node.clientWidth = 1000
    }

    // create map
    this.map = L.map(node, {
      attributionControl: false,
      center: geoData.center,
      zoom: geoData.zoom
    })

    // add the default base layer
    baseLayers[DEFAULT_LAYER].addTo(this.map)

    // create panes (to preserve z-index order)
    this.map.createPane('custom-pane-layers')
    this.map.createPane('custom-pane-buffer')
    this.map.createPane('custom-pane-markers')

    // show metric scale
    L.control.scale({ imperial: false }).addTo(this.map)
  }

  includeControls () {
    // create control to `fitToBounds`
    const fitToButton = L.control({position: 'topleft'})
    fitToButton.onAdd = (map) => {
      const div = L.DomUtil.create('div', 'map__control--button')
      div.innerHTML = '<i class="fa fa-map-marker"></i>'
      L.DomEvent.on(div, 'click', (event) => {
        L.DomEvent.stop(event)
        this.fitToBounds()
      })

      return div
    }
    fitToButton.addTo(this.map)

    // create control to `activate selection mode`
    this.selectionMode = false
    const selectionMode = L.control({position: 'topleft'})
    selectionMode.onAdd = (map) => {
      const div = L.DomUtil.create('div', 'map__control--button')
      div.innerHTML = '<i class="fa fa-bullseye"></i>'
      L.DomEvent.on(div, 'click', (event) => {
        L.DomEvent.stop(event)

        this.selectionMode = !this.selectionMode
        this.updateSelectionPanel()
        if (this.selectionMode) {
          div.innerHTML = '<i class="fa fa-bullseye active"></i>'
        } else {
          div.innerHTML = '<i class="fa fa-bullseye"></i>'
        }
      })

      return div
    }
    selectionMode.addTo(this.map)

    this.selectionPanel = L.control({position: 'topright'})
    this.selectionPanel.onAdd = (map) => {
      return L.DomUtil.create('div', 'map__panel--selection')
    }
    this.selectionPanel.addTo(this.map)

    // tiles control
    L.control.layers(baseLayers, null, {position: 'topleft'}).addTo(this.map)
  }

  includeLayersAndMarkers () {
    // use for the markers
    this.featureGroup = new L.FeatureGroup().addTo(this.map)

    const shapeOptions = {
      pane: 'custom-pane-layers',
      style: () => ({className: 'map-layer transparent'}),
      onEachFeature: (feature, layer) => {
        this.addLayerEvents(layer, feature.properties)
      }
    }

    // plot the ALL zones boundaries
    this.map.addLayer(L.geoJson(geoData.zones, shapeOptions))

    // use for the areas
    const zoomGroup = new L.FeatureGroup()
    zoomGroup.addLayer(L.geoJson(geoData.areas, shapeOptions))

    L.DomEvent.on(this.map, 'zoomend', (event) => {
      // plot the AREAS if the zoom is greater than 9
      if (this.map.getZoom() > 9) {
        if (!this.map.hasLayer(zoomGroup)) {
          this.map.addLayer(zoomGroup)
        }
      } else {
        if (this.map.hasLayer(zoomGroup)) {
          this.map.removeLayer(zoomGroup)
        }
      }
    })

    // plot ALL the villages in different groups based on type
    this.markersGroup = {
      official: new L.FeatureGroup(),
      other: new L.FeatureGroup(),
      unknown: new L.FeatureGroup()
    }
  }

  updateMap () {
    const {
      highlight,
      selected,
      filter,
      buffer,
      select,
      unselect
    } = this.props

    // reset previous state
    this.featureGroup.clearLayers()

    // plot indicated villages
    Object.keys(filter).forEach((key) => {
      this.plotVillagesByType(key, filter[key])
    })
    const plotted = geoData.villages.filter((item) => (filter[item.type]))

    if (highlight && highlight.length) {
      highlight.forEach((item) => {
        const radius = RADIUS[item.type] + RADIUS.highlight
        const options = {
          pane: 'custom-pane-markers',
          radius: radius,
          className: 'map-marker highlight'
        }

        const marker = L.circle(item._latlon, options)
        this.addLayerEvents(marker, item)
        this.featureGroup.addLayer(marker)

        if (buffer > 0 && item.cases > 0) {
          // find out the points within the buffer zone
          // TO BE IMPROVED (quadratic)
          const inBuffer = plotted.filter((entry) => (
              item._id !== entry._id &&
              item._latlon.distanceTo(entry._latlon) <= (buffer + radius)
            ))
          inBuffer.push(item) // this has the info about cases
          const inSelection = selected.filter((entry) => entry._id === item._id).length > 0

          // create buffer zone around the highlighted village
          const bufferZone = L.circle(item._latlon, {
            pane: 'custom-pane-buffer',
            radius: buffer,
            className: 'map-marker buffer'
          })
          this.featureGroup.addLayer(bufferZone)

          bufferZone.on({
            click: (event) => {
              L.DomEvent.stop(event)

              if (this.selectionMode) {
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

    if (selected && selected.length) {
      selected.forEach((item) => {
        // take size from village type and increase it if there are cases
        const radius = RADIUS[item.type] + ((item.cases > 0) ? RADIUS.highlight : 0)
        const options = {
          pane: 'custom-pane-markers',
          radius: radius,
          className: 'map-marker selected'
        }

        const marker = L.circle(item._latlon, options)
        this.addLayerEvents(marker, {...item, selected: true})
        this.featureGroup.addLayer(marker)
      })
    }
  }

  fitToBounds () {
    setTimeout(() => {
      if (this.featureGroup.getLayers().length) {
        this.map.fitBounds(this.featureGroup.getBounds(), { maxZoom: 13 })
      } else {
        this.map.setView(geoData.center, geoData.zoom)
      }
      this.map.invalidateSize()
    }, 1)
  }

  plotVillagesByType (type, active) {
    const layer = this.markersGroup[type]
    if (active) {
      // include layer
      if (!this.map.hasLayer(layer)) {
        this.map.addLayer(layer)

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
      if (this.map.hasLayer(layer)) {
        this.map.removeLayer(layer)
      }
    }
  }

  addLayerEvents (layer, item) {
    const {
      select,
      unselect
    } = this.props

    layer.on({
      click: (event) => {
        L.DomEvent.stop(event)

        if (this.selectionMode) {
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

    this.map.openPopup(div, latlng, { minWidth: 200, maxWidth: 500 })
  }

  updateSelectionPanel () {
    const { selected, unselect } = this.props
    const container = this.selectionPanel.getContainer()

    if (this.selectionMode || selected.length > 0) {
      ReactDOM.render(
        this.injectI18n(
          <DataSelected
            data={selected}
            show={(item) => this.openPopup(item, item._latlon)}
            unselect={unselect} />
        ),
        container
      )
    } else {
      container.innerHTML = ''
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
  filter: PropTypes.object,
  buffer: PropTypes.number,
  highlight: PropTypes.arrayOf(PropTypes.object),
  popup: PropTypes.object,
  selected: PropTypes.arrayOf(PropTypes.object),
  select: PropTypes.func,
  unselect: PropTypes.func,
  intl: intlShape.isRequired
}

export default injectIntl(Map)
