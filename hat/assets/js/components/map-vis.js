import React, {Component, PropTypes} from 'react'
import ReactDOM from 'react-dom'

import chroma from 'chroma-js'
import * as topojson from 'topojson'
import L from 'leaflet'
import mapData from '../utils/mapData'

const TILES_LAYER = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

//
// Copyright (c) 2013 Ryan Clark (https://gist.github.com/rclark/5779673)
//
L.TopoJSON = L.GeoJSON.extend({
  addData: function (jsonData) {
    if (jsonData.type === 'Topology') {
      for (let key in jsonData.objects) {
        const geojson = topojson.feature(jsonData, jsonData.objects[key])
        L.GeoJSON.prototype.addData.call(this, geojson)
      }
    } else {
      L.GeoJSON.prototype.addData.call(this, jsonData)
    }
  }
})

L.topoJson = function (data, options) {
  return new L.TopoJSON(data, options)
}
//
// Copyright (c) 2013 Ryan Clark (https://gist.github.com/rclark/5779673)
//

const last = (a, b) => (a >= b ? a : b)
const cleanString = (a) => a.toUpperCase().replace(/[^A-Z0-9]/g, '')
const compareStrings = (a, b) => (cleanString(a) === cleanString(b))
const findInData = (data, item, keys) => {
  const entries = data.filter((entry) => {
    let found = true
    keys.forEach((key) => {
      found = found && compareStrings(entry[key], item[key])
    })
    return found
  })

  const cases = entries.reduce((prev, curr) => (prev + curr.cases), 0)
  const date = entries.reduce((prev, curr) => last(prev, curr.date), '')
  const tooltip = keys.map((key) => item[key]).join(' / ') +
    (cases ? ' (' + cases + ', ' + date.substring(0, 10) + ')' : '')

  return {cases, date, tooltip}
}

// color scales for zones (blues) and villages (reds)
const ZONES_LIMIT = 15
const zonesScale = chroma.scale('Blues')

const VILLAGES_LIMIT = 5
const villagesScale = chroma.scale('Reds')

const createScale = (container, scale, label, max) => {
  container.innerHTML += '<div>'

  container.innerHTML += '<ul>'
  for (let i = 0.1; i < 1.1; i += 0.1) {
    container.innerHTML += '<li style="background-color: ' + scale(i).hex() + '"></li>'
  }
  container.innerHTML += '</ul>'

  container.innerHTML += '<div class="labels">' +
    '<div class="min">' + label + '</div>' +
    '<div class="max">&gt;' + max + '</div></div>'

  container.innerHTML += '</div>'
}

const legend = L.control({ position: 'bottomright' })
legend.onAdd = (map) => {
  const div = L.DomUtil.create('div', 'info legend')
  div.innerHTML = ''
  createScale(div, zonesScale, 'Zones de Santè', ZONES_LIMIT) // FIXME!!! translate labels
  createScale(div, villagesScale, 'Villages', VILLAGES_LIMIT)
  return div
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
    L.control.scale({ imperial: false }).addTo(this.map) // show scale

    // this layer group is used to plot the zones boundaries without confirmed cases
    this.zonesGroup = new L.FeatureGroup().addTo(this.map)

    // this layer group is used to plot the villages (sense-hat-locations) without confirmed cases
    this.villagesMobileGroup = new L.FeatureGroup().addTo(this.map)

    // these layers group are used to plot the villages&zones with confirmed cases
    this.casesZonesGroup = new L.FeatureGroup().addTo(this.map)
    this.casesGroup = new L.FeatureGroup().addTo(this.map)

    // Add legend
    legend.addTo(this.map)
  }

  updateMap () {
    const data = this.props.data || []

    // remove the previous layers
    this.zonesGroup.clearLayers()
    this.villagesMobileGroup.clearLayers()
    this.casesGroup.clearLayers()
    this.casesZonesGroup.clearLayers()

    this.map.whenReady(() => {
      // plot the zones
      L.topoJson(mapData.zones, {
        style: (feature) => {
          const matched = findInData(data, feature.properties, ['zone'])
          if (matched.cases === 0) {
            return {className: 'map-layer'}
          } else {
            const color = zonesScale(Math.min(matched.cases / ZONES_LIMIT, 1.0)).hex()
            return {
              className: 'map-layer-with-data',
              fillColor: color,
              color: color
            }
          }
        },
        onEachFeature: (feature, layer) => {
          const matched = findInData(data, feature.properties, ['zone'])
          layer.bindTooltip(matched.tooltip, {sticky: true})

          if (matched.cases > 0) {
            this.casesZonesGroup.addLayer(layer)
          } else {
            this.zonesGroup.addLayer(layer)
          }
        }
      })

      // plot the villages (mobile source)
      mapData.villages.mobile.forEach((item) => {
        const matched = findInData(data, item, ['zone', 'area', 'village'])
        if (matched.cases) {
          const color = villagesScale(Math.min(matched.cases / VILLAGES_LIMIT, 1.0)).hex()
          const marker = L.circle(L.latLng(item.lat, item.lon), {
            radius: 400, // metres
            className: 'map-marker-with-data',
            fillColor: color,
            color: color
          })
          marker.bindTooltip(matched.tooltip, {sticky: true})
          this.casesGroup.addLayer(marker)
        } else {
          const marker = L.circle(L.latLng(item.lat, item.lon), {
            radius: 200, // metres
            className: 'map-marker'
          })
          marker.bindTooltip(matched.tooltip, {sticky: true})
          this.villagesMobileGroup.addLayer(marker)
        }
      })

      // fit to data or zones
      setTimeout(() => {
        if (this.casesGroup.getLayers().length) {
          this.map.fitBounds(this.casesGroup.getBounds())
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
