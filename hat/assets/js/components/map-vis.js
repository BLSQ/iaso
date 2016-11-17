import React, {Component, PropTypes} from 'react'
import ReactDOM from 'react-dom'
import {injectIntl, intlShape, defineMessages} from 'react-intl'
import chroma from 'chroma-js'
import L from 'leaflet'
import mapData from '../utils/mapData'

const MESSAGES = defineMessages({
  // layers
  zones: {
    id: 'mapvis.zones',
    defaultMessage: 'Zones de Sante'
  },
  areas: {
    id: 'mapvis.areas',
    defaultMessage: 'Aires de Sante'
  },
  villages: {
    id: 'mapvis.villages',
    defaultMessage: 'Villages'
  },
  zonesWithCases: {
    id: 'mapvis.zones.withcases',
    defaultMessage: 'Zones de Sante with confirmed cases'
  },
  areasWithCases: {
    id: 'mapvis.areas.withcases',
    defaultMessage: 'Aires de Sante with confirmed cases'
  },
  villagesWithCases: {
    id: 'mapvis.villages.withcases',
    defaultMessage: 'Villages with confirmed cases'
  },

  // tooltip labels
  zone: {
    id: 'mapvis.zone',
    defaultMessage: 'Zone de Sante'
  },
  area: {
    id: 'mapvis.area',
    defaultMessage: 'Aire de Sante'
  },
  village: {
    id: 'mapvis.village',
    defaultMessage: 'Village'
  },
  numberOfCases: {
    id: 'mapvis.cases.number',
    defaultMessage: 'Confirmed cases'
  },
  lastDateCase: {
    id: 'mapvis.cases.date',
    defaultMessage: 'Last case date'
  },
  population: {
    id: 'mapvis.population',
    defaultMessage: 'Population'
  }
})

// map base layers (the `key` is the label used in the layers control)
const baseLayers = {
  'Open Street Map': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
  'ArcGIS Street Map': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}.jpg'),
  'ArcGIS Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.jpg'),
  'ArcGIS Topo Map': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}.jpg')
}
// this is the default base layer, it should match one of the base layers keys
const DEFAULT_LAYER = 'Open Street Map'

// Create legend for both zones (blues) and villages (reds)
// check https://github.com/gka/chroma.js/wiki/Color-Scales
const ZONES_LIMIT = 15
const zonesScale = chroma.scale('Blues')

const VILLAGES_LIMIT = 15
const villagesScale = chroma.scale('Reds')

const createLegendScale = (container, scale, label, max) => {
  container.innerHTML += '<div>'

  container.innerHTML += '<ul>'
  // we assume that the scale goes from 0 to 100% so we only create
  // squares starting in 10% (1 case) to 100% (max value accepted)
  // the step is 10%
  for (let i = 0.1; i < 1.1; i += 0.1) {
    container.innerHTML += '<li style="background-color: ' + scale(i).hex() + '"></li>'
  }
  container.innerHTML += '</ul>'

  container.innerHTML += '<div class="labels">' +
    '<div class="min">' + label + '</div>' +
    '<div class="max">&gt;' + max + '</div></div>'

  container.innerHTML += '</div>'
}

const createTooltip = (intl, item) => {
  let tooltip = '<div class="tooltip"><table>'

  if (item.zone) {
    tooltip += '<tr>' +
      '<td><b>' + intl.formatMessage(MESSAGES.zone) + '</b></td>' +
      '<td>' + item.zone + '</td>' +
      '</tr>'
  }
  if (item.area) {
    tooltip += '<tr>' +
      '<td><b>' + intl.formatMessage(MESSAGES.area) + '</b></td>' +
      '<td>' + item.area + '</td>' +
      '</tr>'
  }
  if (item.village) {
    tooltip += '<tr>' +
      '<td><b>' + intl.formatMessage(MESSAGES.village) + '</b></td>' +
      '<td>' + item.village + '</td>' +
      '</tr>'
  }
  if (item.cases) {
    tooltip += '<tr>' +
      '<td><b>' + intl.formatMessage(MESSAGES.numberOfCases) + '</b></td>' +
      '<td>' + item.cases + '<br/>' +
      '</tr><tr>' +
      '<td><b>' + intl.formatMessage(MESSAGES.lastDateCase) + '</b></td>' +
      '<td>' + intl.formatDate(item.date) +
      '</tr>'
  }
  if (item.population) {
    tooltip += '<tr>' +
      '<td><b>' + intl.formatMessage(MESSAGES.population) + '</b></td>' +
      '<td>' + item.population + '</td>' +
      '</tr>'
  }
  if (item.village) {
    // include buffer option?
  }

  tooltip += '</table></div>'
  return tooltip
}

// find all the entries in the list that match exact
// with the item values in the indicated keys list
//
// keys: [ 'a', 'b', 'c' ]
// item: { a: 'aàa', b: 'bBb', c: 'cçC', d: 'xxx' }
// one matched value could be: { a: 'AaA', b: 'bbb', c: 'ÇÇÇ', f: 'zzz' }
const findInData = (list, item, keys) => {
  // taken from sense-hat-mobile
  const stripAccents = (word) => {
    return word.toUpperCase()
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

class MapVis extends Component {
  componentDidMount () {
    this.createMap()
    this.updateMap()
  }
  componentDidUpdate () {
    this.updateMap()
  }
  componentWillUnmount () {
    if (this.map) {
      this.map.remove()
    }
  }

  createMap () {
    const node = ReactDOM.findDOMNode(this)
    const {formatMessage} = this.props.intl

    // HACK: Work around for testing Leaflet in JSDOM
    // see: https://github.com/Leaflet/Leaflet/issues/4823
    if (!node.clientWidth && !node.clientHeight) {
      node.clientHeight = 700
      node.clientWidth = 1000
    }

    // create map
    this.map = L.map(node, {
      attributionControl: false,
      center: mapData.center,
      zoom: mapData.zoom
    })

    // add the default base layer
    baseLayers[DEFAULT_LAYER].addTo(this.map)

    // create layers panes (to preserve z-index order)
    this.map.createPane('boundaries')
    this.map.createPane('villages')
    this.map.createPane('cases')
    this.map.createPane('selected')

    // show metric scale
    L.control.scale({ imperial: false }).addTo(this.map)

    // colour scales legend
    const legend = L.control({ position: 'bottomright' })
    legend.onAdd = (map) => {
      const div = L.DomUtil.create('div', 'info legend')
      div.innerHTML = ''
      createLegendScale(div, zonesScale, formatMessage(MESSAGES.zones), ZONES_LIMIT)
      createLegendScale(div, villagesScale, formatMessage(MESSAGES.villages), VILLAGES_LIMIT)
      return div
    }
    legend.addTo(this.map)

    // add zones boundaries and villages
    // this layer group is used to plot the zones boundaries
    const zonesGroup = new L.FeatureGroup().addTo(this.map)
    // plot the ALL zones
    L.geoJson(mapData.zones, {
      pane: 'boundaries',
      style: (feature) => ({className: 'map-layer'}),
      onEachFeature: (feature, layer) => {
        // layer.bindTooltip(createTooltip(this.props.intl, feature.properties), {sticky: true})
        layer.bindPopup(createTooltip(this.props.intl, feature.properties), {closeButton: false})
        zonesGroup.addLayer(layer)
      }
    })

    // this layer group is used to plot the villages
    const villagesGroup = new L.FeatureGroup().addTo(this.map)
    // plot ALL the villages as a circle
    mapData.villages.forEach((item) => {
      const marker = L.circle(L.latLng(item.lat, item.lon), {
        pane: 'villages',
        radius: 200, // metres
        className: 'map-marker'
      })
      // marker.bindTooltip(createTooltip(this.props.intl, item), {sticky: true})
      marker.bindPopup(createTooltip(this.props.intl, item), {closeButton: false})
      villagesGroup.addLayer(marker)
    })

    // these layers group are used to plot the villages&zones with confirmed cases
    this.casesVillagesGroup = new L.FeatureGroup().addTo(this.map)
    this.casesZonesGroup = new L.FeatureGroup().addTo(this.map)

    // add layers control
    // (the `key` is the label used in the layers control)
    const overlays = {}
    overlays[formatMessage(MESSAGES.villages)] = villagesGroup
    overlays[formatMessage(MESSAGES.zonesWithCases)] = this.casesZonesGroup
    overlays[formatMessage(MESSAGES.villagesWithCases)] = this.casesVillagesGroup
    L.control.layers(baseLayers, overlays).addTo(this.map)
  }

  updateMap () {
    const data = this.props.data || []

    this.map.whenReady(() => {
      // plot ONLY the zones with confirmed cases
      this.casesZonesGroup.clearLayers()
      mapData.zones.features.forEach((item) => {
        const matched = findInData(data, item.properties, ['zone'])

        // find out the number of cases and the onset date of the last case
        const cases = matched.reduce((prev, curr) => (prev + curr.cases), 0)
        const date = matched.reduce((prev, curr) => (prev >= curr.date ? prev : curr.date), '')
        const tooltip = createTooltip(this.props.intl, {...item.properties, cases, date})

        if (cases) {
          // build color depending on number of cases in the zone
          const color = zonesScale(Math.min(cases / ZONES_LIMIT, 1.0))
          L.geoJson(item, {
            pane: 'boundaries',
            style: (feature) => ({
              className: 'map-layer-with-data',
              fillColor: color.hex(),
              color: color.darken().hex()
            }),
            onEachFeature: (feature, layer) => {
              // layer.bindTooltip(tooltip, {sticky: true})
              layer.bindPopup(tooltip, {closeButton: false})
              this.casesZonesGroup.addLayer(layer)
            }
          })
        }
      })

      // plot ONLY the villages with confirmed cases
      this.casesVillagesGroup.clearLayers()
      data.forEach((item) => {
        const matched = findInData(mapData.villages, item, ['zone', 'area', 'village'])
        if (matched.length > 0) {
          // build color depending on number of cases in the village
          const color = villagesScale(Math.min(item.cases / VILLAGES_LIMIT, 1.0))
          const tooltip = createTooltip(this.props.intl, item)
          const lat = parseFloat(matched[0].lat)
          const lon = parseFloat(matched[0].lon)

          const marker = L.circle(L.latLng(lat, lon), {
            pane: 'cases',
            radius: 400, // metres
            className: 'map-marker-with-data',
            fillColor: color.hex(),
            color: color.darken().hex()
          })
          // marker.bindTooltip(tooltip, {sticky: true})
          marker.bindPopup(tooltip, {closeButton: false})
          this.casesVillagesGroup.addLayer(marker)
        }
      })

      // fit to data or default
      setTimeout(() => {
        if (this.map.hasLayer(this.casesVillagesGroup) &&
            this.casesVillagesGroup.getLayers().length) {
          this.map.fitBounds(this.casesVillagesGroup.getBounds())
        } else {
          this.map.setView(mapData.center, mapData.zoom)
        }
        this.map.invalidateSize()
      }, 1)
    })
  }
  render () {
    return <div ref={(node) => (this.container = node)} className='map-container' />
  }
}

MapVis.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  intl: intlShape.isRequired
}

export default injectIntl(MapVis)
