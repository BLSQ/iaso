import React, {Component, PropTypes} from 'react'
import ReactDOM from 'react-dom'
import {injectIntl, intlShape, defineMessages} from 'react-intl'
import L from 'leaflet'
import geoData from '../utils/geoData'

const MESSAGES = defineMessages({
  // layers
  areas: {
    id: 'mapvis.areas',
    defaultMessage: 'Aires de Sante'
  },
  official: {
    id: 'mapvis.villages.official',
    defaultMessage: 'Official villages'
  },
  other: {
    id: 'mapvis.villages.other',
    defaultMessage: 'Other settlements'
  },
  unknown: {
    id: 'mapvis.villages.unknown',
    defaultMessage: 'Unknown villages'
  },
  highlightedAreas: {
    id: 'mapvis.areas.highlighted',
    defaultMessage: 'Highlighted Aires de Sante'
  },
  highlightedVillages: {
    id: 'mapvis.villages.highlighted',
    defaultMessage: 'Highlighted villages'
  },
  selectedVillages: {
    id: 'mapvis.villages.selected',
    defaultMessage: 'Selected villages'
  }
})

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
    const {formatMessage} = this.props.intl
    const {showDetails} = this.props

    // HACK: Work around for testing Leaflet in JSDOM
    // see: https://github.com/Leaflet/Leaflet/issues/4823
    if (!node.clientWidth && !node.clientHeight) {
      node.clientHeight = 700
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

    // create layers panes (to preserve z-index order)
    this.map.createPane('boundaries')
    this.map.createPane('markers')
    this.map.createPane('highlighted')
    this.map.createPane('selected')
    this.map.createPane('detailed')

    // show metric scale
    L.control.scale({ imperial: false }).addTo(this.map)

    // this layer group is used to plot the areas boundaries
    const areasGroup = new L.FeatureGroup().addTo(this.map)
    // plot the ALL areas boundaries
    L.geoJson(geoData.areas, {
      pane: 'boundaries',
      style: (feature) => ({className: 'map-layer'}),
      onEachFeature: (feature, layer) => {
        layer.on({ click: (e) => { showDetails(feature.properties) } })
        layer.bindTooltip(
          feature.properties.zone + ' - ' + feature.properties.area,
          { sticky: true })
        areasGroup.addLayer(layer)
      }
    })

    this.groups = {
      // these layers groups are used to plot the villages
      official: new L.FeatureGroup().addTo(this.map),
      other: new L.FeatureGroup().addTo(this.map),
      unknown: new L.FeatureGroup(), // not included by default
      // these layers groups are used to plot the highlighted villages & areas
      highlight: {
        areas: new L.FeatureGroup().addTo(this.map),
        villages: new L.FeatureGroup().addTo(this.map)
      },
      // this layer group is used to plot the selected villages
      selected: new L.FeatureGroup().addTo(this.map)
    }

    // add layers control (allows to show/hide them)
    // (the `key` is the label used in the layers control)
    const overlays = {}
    overlays[formatMessage(MESSAGES.official)] = this.groups.official
    overlays[formatMessage(MESSAGES.other)] = this.groups.other
    overlays[formatMessage(MESSAGES.unknown)] = this.groups.unknown
    overlays[formatMessage(MESSAGES.highlightedAreas)] = this.groups.highlight.areas
    overlays[formatMessage(MESSAGES.highlightedVillages)] = this.groups.highlight.villages
    overlays[formatMessage(MESSAGES.selectedVillages)] = this.groups.selected
    L.control.layers(baseLayers, overlays).addTo(this.map)

    // create new control to `fitToBounds`
    const fitToButton = L.control({position: 'topright'})
    fitToButton.onAdd = (map) => {
      const div = L.DomUtil.create('div', 'map-button')
      div.innerHTML = '<i class="fa fa-arrows-alt"></i>'
      L.DomEvent.on(div, 'click', () => {
        this.fitToBounds()
      })

      return div
    }
    fitToButton.addTo(this.map)
  }

  updateMap () {
    const {areas, points, detailed, showDetails} = this.props
    const SIZES = {
      official: 300,
      other: 150,
      unknown: 100
    } // metres

    // reset ALL groups
    this.groups.highlight.areas.clearLayers()
    this.groups.highlight.villages.clearLayers()
    this.groups.official.clearLayers()
    this.groups.other.clearLayers()
    this.groups.unknown.clearLayers()
    this.groups.selected.clearLayers()

    this.map.whenReady(() => {
      if (areas && areas.length) {
        areas.forEach((item) => {
          L.geoJson(item, {
            pane: 'boundaries',
            style: (feature) => ({
              className: 'map-layer-highlight',
              fillColor: item.properties.color.hex(),
              color: item.properties.color.darken().hex()
            }),
            onEachFeature: (feature, layer) => {
              layer.on({ click: (e) => { showDetails(feature.properties) } })
              layer.bindTooltip(
                feature.properties.zone + ' - ' + feature.properties.area,
                { sticky: true })
              this.groups.highlight.areas.addLayer(layer)
            }
          })
        })
      }

      if (detailed && !detailed.isVillage) {
        // it's an area (search it)
        // create an overlapped layer in the highlight pane
        const area = geoData.areas.features.find((item) =>
          item.properties.zone === detailed.zone &&
          item.properties.area === detailed.area)
        if (area) {
          L.geoJson(area, {
            pane: 'boundaries',
            style: (feature) => ({
              className: 'map-layer-detailed'
            }),
            onEachFeature: (feature, layer) => {
              this.groups.highlight.areas.addLayer(layer)
            }
          })
        }
      }

      if (points && points.length) {
        points.forEach((item) => {
          const size = SIZES[item.type]
          const events = { click: () => { showDetails(item) } }

          const marker = L.circle(L.latLng(item.lat, item.lon), {
            pane: 'markers',
            radius: size,
            className: 'map-marker ' + item.type
          })
          marker.on(events)
          marker.bindTooltip(item.village, {sticky: true})
          this.groups[item.type].addLayer(marker)

          if (item.cases > 0) {
            const highlighted = L.circle(L.latLng(item.lat, item.lon), {
              pane: 'highlighted',
              radius: size + 20,
              className: 'map-marker highlight'
            })
            highlighted.on(events)
            highlighted.bindTooltip(item.village, {sticky: true})
            this.groups.highlight.villages.addLayer(highlighted)
          }

          if (item.selected) {
            const selected = L.circle(L.latLng(item.lat, item.lon), {
              pane: 'selected',
              radius: size + 30,
              className: 'map-marker selected'
            })
            selected.on(events)
            selected.bindTooltip(item.village, {sticky: true})
            this.groups.selected.addLayer(selected)
          }
        })

        // bold detailed on map
        if (detailed && detailed.isVillage) {
          // it's a village
          // create an overlapped marker in the selected pane
          const point = L.circle(L.latLng(detailed.lat, detailed.lon), {
            pane: 'selected',
            radius: SIZES[detailed.type] + 10, // metres
            className: 'map-marker detailed'
          })
          point.bindTooltip(detailed.village, {sticky: true})
          this.groups.selected.addLayer(point)
        }
      }
    })
  }

  fitToBounds () {
    setTimeout(() => {
      // fit to:
      // 1. selected,
      // 2. highlight,
      // 3. official villages,
      // 4. default

      if (this.map.hasLayer(this.groups.selected) &&
          this.groups.selected.getLayers().length) {
        this.map.fitBounds(this.groups.selected.getBounds())
        // fit to selected
        //
      } else if (this.map.hasLayer(this.groups.highlight.villages) &&
          this.groups.highlight.villages.getLayers().length) {
        this.map.fitBounds(this.groups.highlight.villages.getBounds())
        // fit to highlight points
        //
      } else if (this.map.hasLayer(this.groups.highlight.areas) &&
          this.groups.highlight.areas.getLayers().length) {
        this.map.fitBounds(this.groups.highlight.areas.getBounds())
        // fit to highlight areas
        //
      } else if (this.map.hasLayer(this.groups.official) &&
          this.groups.official.getLayers().length) {
        this.map.fitBounds(this.groups.official.getBounds())
        // fit to official villages
        //
      } else {
        this.map.setView(geoData.center, geoData.zoom)
      }

      this.map.invalidateSize()
    }, 1)
  }
}

Map.propTypes = {
  areas: PropTypes.arrayOf(PropTypes.object),
  points: PropTypes.arrayOf(PropTypes.object),
  detailed: PropTypes.object,
  showDetails: PropTypes.func,
  intl: intlShape.isRequired
}

export default injectIntl(Map)
