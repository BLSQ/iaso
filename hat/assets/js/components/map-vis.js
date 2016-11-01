import React, {Component, PropTypes} from 'react'
import ReactDOM from 'react-dom'
import chroma from 'chroma-js'
import L from 'leaflet'
import mapData from '../utils/mapData'

// using OSM layers
const TILES_LAYER = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

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

// this creates the legend but doesn't add it to the map
const legend = L.control({ position: 'bottomright' })
legend.onAdd = (map) => {
  const div = L.DomUtil.create('div', 'info legend')
  div.innerHTML = ''
  createLegendScale(div, zonesScale, 'Zones de Santè', ZONES_LIMIT) // FIXME!!! translate labels
  createLegendScale(div, villagesScale, 'Villages', VILLAGES_LIMIT)
  return div
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

  const matched = list.filter((entry) => (
    keys.every((key) => stripAccents(entry[key]) === stripAccents(item[key]))
  ))

  // find out the number of cases and the onset date of the last case
  const cases = matched.reduce((prev, curr) => (prev + curr.cases), 0)
  const date = matched.reduce((prev, curr) => (prev >= curr.date ? prev : curr.date), '')
  // create a simple tooltip with this info
  const tooltip = keys.map((key) => item[key]).join(' / ') +
    (cases ? ' (' + cases + ', ' + date.substring(0, 10) + ')' : '')

  return {cases, date, tooltip}
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

    // HACK: Work around for testing Leaflet in JSDOM
    // see: https://github.com/Leaflet/Leaflet/issues/4823
    if (!node.clientWidth && !node.clientHeight) {
      node.clientHeight = 700
      node.clientWidth = 1000
    }

    this.map = L.map(node, {
      attributionControl: false,
      center: mapData.center,
      zoom: mapData.zoom
    })

    // tiles layer
    L.tileLayer(TILES_LAYER).addTo(this.map)
    L.control.scale({ imperial: false }).addTo(this.map) // show metric scale

    // this layer group is used to plot the zones boundaries
    this.zonesGroup = new L.FeatureGroup().addTo(this.map)
    // plot the ALL zones
    L.geoJson(mapData.zones, {
      style: (feature) => ({className: 'map-layer'}),
      onEachFeature: (feature, layer) => {
        layer.bindTooltip(feature.properties.zone, {sticky: true})
        this.zonesGroup.addLayer(layer)
      }
    })

    // this layer group is used to plot the villages
    this.villagesGroup = new L.FeatureGroup().addTo(this.map)
    // plot ALL the villages as a gray circle
    mapData.villages.forEach((item) => {
      const marker = L.circle(L.latLng(item.lat, item.lon), {
        radius: 200, // metres
        className: 'map-marker'
      })
      marker.bindTooltip(item.village, {sticky: true})
      this.villagesGroup.addLayer(marker)
    })

    // these layers group are used to plot the villages&zones with confirmed cases
    this.casesZonesGroup = new L.FeatureGroup().addTo(this.map)
    this.casesVillagesGroup = new L.FeatureGroup().addTo(this.map)

    // Add legend
    legend.addTo(this.map)
  }

  updateMap () {
    const data = this.props.data || []

    this.map.whenReady(() => {
      // plot ONLY the zones with confirmed cases
      this.casesZonesGroup.clearLayers()
      mapData.zones.features.forEach((item) => {
        const matched = findInData(data, item.properties, ['zone'])
        if (matched.cases) {
          // build color depending on number of cases in the zone
          const color = zonesScale(Math.min(matched.cases / ZONES_LIMIT, 1.0)).hex()
          L.geoJson(item, {
            style: (feature) => ({
              className: 'map-layer-with-data',
              fillColor: color,
              color: color
            }),
            onEachFeature: (feature, layer) => {
              layer.bindTooltip(matched.tooltip, {sticky: true})
              this.casesZonesGroup.addLayer(layer)
            }
          })
        }
      })

      // remove and add the villages layer
      // (order matters, always above boundaries)
      this.map.removeLayer(this.villagesGroup)
      this.map.addLayer(this.villagesGroup)

      // plot ONLY the villages with confirmed cases
      this.casesVillagesGroup.clearLayers()
      // this should be the other way around
      // once we have "reconciliation" the data list should contain
      // the matching villages with its geopoints
      // expected: data.forEach((item) => { ... })
      mapData.villages.forEach((item) => {
        const matched = findInData(data, item, ['zone', 'area', 'village'])
        if (matched.cases) {
          // build color depending on number of cases in the village
          const color = villagesScale(Math.min(matched.cases / VILLAGES_LIMIT, 1.0)).hex()

          const marker = L.circle(L.latLng(item.lat, item.lon), {
            radius: 400, // metres
            className: 'map-marker-with-data',
            fillColor: color,
            color: color
          })
          marker.bindTooltip(matched.tooltip, {sticky: true})
          this.casesVillagesGroup.addLayer(marker)
        }
      })

      // fit to data or zones
      setTimeout(() => {
        if (this.casesVillagesGroup.getLayers().length) {
          this.map.fitBounds(this.casesVillagesGroup.getBounds())
        } else {
          this.map.fitBounds(this.zonesGroup.getBounds())
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
  data: PropTypes.arrayOf(PropTypes.object)
}

export default MapVis
