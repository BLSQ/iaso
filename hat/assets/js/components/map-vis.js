import React, {Component, PropTypes} from 'react'
import ReactDOM from 'react-dom'

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

const cleanString = (a) => (a.toUpperCase().replace(/[^A-Z0-9]/g, ''))
const compareStrings = (a, b) => (cleanString(a) === cleanString(b))

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
  }

  updateMap () {
    const data = this.props.data || []

    const findInData = (item, key) => {
      return data.filter((entry) => (compareStrings(entry[key], item[key])))
    }

    // remove the previous layers
    this.zonesGroup.clearLayers()
    this.villagesMobileGroup.clearLayers()
    this.casesGroup.clearLayers()
    this.casesZonesGroup.clearLayers()

    this.map.whenReady(() => {
      // plot the zones
      L.topoJson(mapData.zones, {
        style: (feature) => {
          const cases = findInData(feature.properties, 'zone').length
          if (cases === 0) {
            return {className: 'map-layer'}
          } else {
            return {
              className: 'map-layer-with-data'
              // TBD: decide the fill color depending on the number of cases
              // fillColor: depends on nr of cases
            }
          }
        },
        onEachFeature: (feature, layer) => {
          const confirmed = (findInData(feature.properties, 'zone').length > 0)
          const badge = (confirmed ? ' (' + confirmed + ')' : '')
          layer.bindTooltip(feature.properties.zone + badge, {sticky: true})

          if (confirmed) {
            this.casesZonesGroup.addLayer(layer)
          } else {
            this.zonesGroup.addLayer(layer)
          }
        }
      })

      // plot the villages (mobile source)
      mapData.villages.mobile.forEach((item) => {
        const confirmed = findInData(item, 'village')

        if (confirmed.length) {
          // buffer zone
          // this.casesGroup.addLayer(L.circle(L.latLng(item.lat, item.lon), {
          //   radius: 1000, // metres
          //   className: 'map-marker-buffer'
          // }))

          // village
          const marker = L.circle(L.latLng(item.lat, item.lon), {
            radius: 400, // metres
            className: 'map-marker-with-data'
            // TBD: decide the fill color depending on the number of cases
            // fillColor: depends on nr of cases
          })
          marker.bindTooltip(item.village +
            ' (' +
            confirmed[0].cases + ', ' +
            confirmed[0].date.substring(0, 10) +
            ')',
            {sticky: true})
          this.casesGroup.addLayer(marker)
        } else {
          const marker = L.circle(L.latLng(item.lat, item.lon), {
            radius: 200, // metres
            className: 'map-marker'
          })
          marker.bindTooltip(item.village, {sticky: true})
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
