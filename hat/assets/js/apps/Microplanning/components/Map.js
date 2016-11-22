import React, {Component, PropTypes} from 'react'
import ReactDOM from 'react-dom'
import {IntlProvider, injectIntl, intlShape} from 'react-intl'
import L from 'leaflet'
import geoData from '../utils/geoData'
import {default as MapTooltip} from './MapTooltip'

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
    this.updateMap()
    this.fitToBounds()
  }
  componentDidUpdate () {
    this.updateMap()
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

    // create new control to `fitToBounds`
    const fitToButton = L.control({position: 'topleft'})
    fitToButton.onAdd = (map) => {
      const div = L.DomUtil.create('div', 'map-button')
      div.innerHTML = '<i class="fa fa-map-marker"></i>'
      L.DomEvent.on(div, 'click', (event) => {
        L.DomEvent.stop(event)
        this.fitToBounds()
      })

      return div
    }
    fitToButton.addTo(this.map)

    L.control.layers(baseLayers).addTo(this.map)

    const shapeOptions = {
      pane: 'custom-pane-layers',
      style: () => ({className: 'map-layer transparent'}),
      onEachFeature: (feature, layer) => {
        this.layerCommons(layer, feature.properties)
      }
    }

    // plot the ALL zones boundaries
    this.map.addLayer(L.geoJson(geoData.zones, shapeOptions))

    // use for the areas
    const zoomGroup = new L.FeatureGroup()
    zoomGroup.addLayer(L.geoJson(geoData.areas, shapeOptions))

    // use for the markers
    this.featureGroup = new L.FeatureGroup().addTo(this.map)
    // use for the shape/marker details
    this.detailsGroup = new L.FeatureGroup().addTo(this.map)

    L.DomEvent.on(this.map, 'zoomend', (event) => {
      // plot the AREAS if the zoom is greater than 9
      if (this.map.getZoom() > 9) {
        if (!this.map.hasLayer(this.zoomGroup)) {
          this.map.addLayer(zoomGroup)
        }
      } else {
        this.map.removeLayer(zoomGroup)
      }
    })

    // plot ALL the villages in different groups based on type
    this.markersGroup = {
      official: new L.FeatureGroup(),
      other: new L.FeatureGroup(),
      unknown: new L.FeatureGroup()
    }

    geoData.villages.forEach((item) => {
      const options = {
        pane: 'custom-pane-markers',
        radius: RADIUS[item.type],
        className: 'map-marker ' + item.type
      }

      const marker = L.circle(item._latlon, options)
      this.layerCommons(marker, item)
      this.markersGroup[item.type].addLayer(marker)
    })
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
    this.detailsGroup.clearLayers()

    // plot indicated villages
    Object.keys(filter).forEach((key) => {
      const layer = this.markersGroup[key]
      if (filter[key]) {
        if (!this.map.hasLayer(layer)) {
          this.map.addLayer(layer)
        }
      } else {
        this.map.removeLayer(layer)
      }
    })
    const plotted = geoData.villages.filter((entry) => (filter[entry.type]))

    this.map.whenReady(() => {
      if (highlight && highlight.length) {
        highlight.forEach((item) => {
          const radius = RADIUS[item.type] + RADIUS.highlight
          const options = {
            pane: 'custom-pane-markers',
            radius: radius,
            className: 'map-marker highlight'
          }

          const marker = L.circle(item._latlon, options)
          this.layerCommons(marker, item)
          this.featureGroup.addLayer(marker)

          if (buffer > 0 && item.cases > 0) {
            // find out the points within the buffer zone
            // TO BE IMPROVED (quadratic)
            const inBuffer = plotted.filter((entry) => (
                item._id !== entry._id &&
                item._latlon.distanceTo(entry._latlon) <= (buffer + radius)
              ))
            inBuffer.push(item) // this has the info about cases

            // create buffer zone around the highlighted village
            const bufferZone = L.circle(item._latlon, {
              pane: 'custom-pane-buffer',
              radius: buffer,
              className: 'map-marker buffer'
            })
            this.featureGroup.addLayer(bufferZone)

            bufferZone.on({
              dblclick: (event) => {
                if (item.selected) {
                  unselect(inBuffer)
                } else {
                  select(inBuffer)
                }
                L.DomEvent.stop(event)
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
          this.layerCommons(marker, item)
          this.featureGroup.addLayer(marker)
        })
      }
    })
  }

  fitToBounds () {
    this.map.whenReady(() => {
      setTimeout(() => {
        if (this.detailsGroup.getLayers().length) {
          this.map.fitBounds(this.detailsGroup.getBounds(), { maxZoom: 13 })
        } else if (this.featureGroup.getLayers().length) {
          this.map.fitBounds(this.featureGroup.getBounds(), { maxZoom: 13 })
        } else {
          this.map.setView(geoData.center, geoData.zoom)
        }
        this.map.invalidateSize()
      }, 1)
    })
  }

  layerCommons (layer, item) {
    const {
      select,
      unselect
    } = this.props

    const div = L.DomUtil.create('div', 'tooltip')
    const {locale, messages} = this.props.intl
    // we need to wrap it with IntlProvider to use i18n features
    ReactDOM.render(
      <IntlProvider locale={locale} messages={messages}>
        <MapTooltip item={item} />
      </IntlProvider>,
      div
    )

    layer.on({
      dblclick: (event) => {
        L.DomEvent.stop(event)
        if (item.isVillage) {
          if (item.selected) {
            unselect([item])
          } else {
            select([item])
          }
        }
      },
      contextmenu: (event) => {
        L.DomEvent.stop(event)
        this.map.openPopup(div, event.latlng, {minWidth: 200, maxWidth: 500})
      }
    })
    layer.bindTooltip(item._label, { sticky: true })
  }
}

Map.propTypes = {
  filter: PropTypes.object,
  buffer: PropTypes.number,
  highlight: PropTypes.arrayOf(PropTypes.object),
  selected: PropTypes.arrayOf(PropTypes.object),
  select: PropTypes.func,
  unselect: PropTypes.func,
  intl: intlShape.isRequired
}

export default injectIntl(Map)
