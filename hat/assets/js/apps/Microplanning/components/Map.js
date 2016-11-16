import React, {Component, PropTypes} from 'react'
import ReactDOM from 'react-dom'
import {injectIntl, intlShape} from 'react-intl'
import L from 'leaflet'
import geoData from '../utils/geoData'

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
    const {show} = this.props

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

    // create panes (to preserve z-index order)
    this.map.createPane('custom-pane-layers')
    this.map.createPane('custom-pane-markers')

    // show metric scale
    L.control.scale({ imperial: false }).addTo(this.map)

    // create new control to `fitToBounds`
    const fitToButton = L.control({position: 'topright'})
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

    // plot the ALL areas boundaries
    const areas = L.geoJson(geoData.areas, {
      pane: 'custom-pane-layers',
      style: (feature) => ({className: 'map-layer transparent'}),
      onEachFeature: (feature, layer) => {
        layer.on({
          click: () => { show(feature.properties) },
          contextmenu: () => { show(feature.properties) }
        })
        layer.bindTooltip(
          feature.properties.zone + ' - ' + feature.properties.area,
          { sticky: true })
      }
    })
    this.map.addLayer(areas)

    // use for the dynamic points, areas...
    this.featureGroup = new L.FeatureGroup().addTo(this.map)
    // use for the details area/point
    this.detailsGroup = new L.FeatureGroup().addTo(this.map)

    L.control.layers(baseLayers).addTo(this.map)
  }

  updateMap () {
    const {
      areas,
      points,
      details,
      centered,
      buffer,
      select,
      unselect,
      show
    } = this.props

    // circle size in metres depending on the village type
    const RADIUS = {
      official: 130,
      other: 100,
      unknown: 100
    }

    // reset previous state
    this.featureGroup.clearLayers()
    this.detailsGroup.clearLayers()

    this.map.whenReady(() => {
      if (areas && areas.length) {
        areas.forEach((item) => {
          this.featureGroup.addLayer(L.geoJson(item, {
            pane: 'custom-pane-layers',
            style: (feature) => ({
              className: 'map-layer highlight',
              fillColor: item.properties.color.hex(),
              color: item.properties.color.darken().hex()
            }),
            onEachFeature: (feature, layer) => {
              layer.on({
                click: () => { show(feature.properties) },
                contextmenu: () => { show(feature.properties) }
              })
              layer.bindTooltip(
                feature.properties.zone + ' - ' + feature.properties.area,
                { sticky: true })
            }
          }))
        })
      }

      if (points && points.length) {
        points.forEach((item) => {
          // take size from village type and increase it if there are cases
          const radius = RADIUS[item.type] + ((item.cases > 0) ? 10 : 0)
          const events = {
            click: () => { show(item) },
            contextmenu: () => { show(item) }
          }

          const options = {
            pane: 'custom-pane-markers',
            radius: radius,
            className: 'map-marker '
          }

          if (item.selected) {
            options.className += 'selected'
          } else if (item.cases > 0) {
            options.className += 'highlight'
          } else {
            options.className += item.type
          }

          const marker = L.circle(item._latlon, options)
          marker.on(events)
          marker.bindTooltip(item.village)
          this.featureGroup.addLayer(marker)

          if (buffer > 0 && item.cases > 0) {
            // find out the points within the buffer zone
            // TO BE IMPROVED (quadratic)
            const inBuffer = points.filter((entry) => (
              item._latlon.distanceTo(entry._latlon) <= (buffer + radius)
            ))

            // create buffer zone around the highlighted village
            const bufferZone = L.circle(item._latlon, {
              pane: 'custom-pane-layers',
              radius: buffer,
              className: 'map-marker buffer'
            })
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
            this.featureGroup.addLayer(bufferZone)
          }
        })
      }

      if (details) {
        if (!details.isVillage) {
          const area = geoData.areas.features.find((item) =>
            item.properties._id === details._id
          )
          if (area) {
            this.detailsGroup.addLayer(L.geoJson(area, {
              pane: 'custom-pane-layers',
              style: (feature) => ({ className: 'map-layer details' }),
              onEachFeature: (feature, layer) => {
                layer.on({
                  click: () => { show() },
                  contextmenu: () => { show() }
                })
              }
            }))
          }
        } else {
          // it's a village
          const point = L.circle(details._latlon, {
            pane: 'custom-pane-markers',
            radius: RADIUS[details.type],
            className: 'map-marker details'
          })
          point.on({
            dblclick: (event) => {
              if (details.selected) {
                unselect([details._id])
              } else {
                select([details])
              }
              show()
              L.DomEvent.stop(event)
            }
          })
          this.detailsGroup.addLayer(point)
        }

        if (centered) {
          this.fitToBounds()
        }
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
}

Map.propTypes = {
  areas: PropTypes.arrayOf(PropTypes.object),
  buffer: PropTypes.number,
  details: PropTypes.object,
  centered: PropTypes.bool,
  points: PropTypes.arrayOf(PropTypes.object),
  show: PropTypes.func,
  select: PropTypes.func,
  unselect: PropTypes.func,
  intl: intlShape.isRequired
}

export default injectIntl(Map)
