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

    // create panes (to preserve z-index order)
    this.map.createPane('custom-pane-layers')
    this.map.createPane('custom-pane-markers')

    // show metric scale
    L.control.scale({ imperial: false }).addTo(this.map)

    // create new control to `fitToBounds`
    const fitToButton = L.control({position: 'topright'})
    fitToButton.onAdd = (map) => {
      const div = L.DomUtil.create('div', 'map-button')
      div.innerHTML = '<i class="fa fa-arrows-alt"></i>'
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
          click: () => { showDetails(feature.properties) },
          contextmenu: () => { showDetails(feature.properties) }
        })
        layer.bindTooltip(
          feature.properties.zone + ' - ' + feature.properties.area,
          { sticky: true })
      }
    })
    this.map.addLayer(areas)

    // use for the dynamic points, areas...
    this.featureGroup = new L.FeatureGroup().addTo(this.map)

    L.control.layers(baseLayers).addTo(this.map)
  }

  updateMap () {
    const {
      areas,
      points,
      detailed,
      buffer,
      select,
      unselect,
      showDetails
    } = this.props

    const RADIUS = { // metres
      official: 130,
      other: 100,
      unknown: 100
    }

    // reset previous state
    this.featureGroup.clearLayers()

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
                click: () => { showDetails(feature.properties) },
                contextmenu: () => { showDetails(feature.properties) }
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
          const radius = RADIUS[item.type] + ((item.cases > 0) ? 10 : 0)
          const events = {
            click: () => { showDetails(item) },
            contextmenu: () => { showDetails(item) }
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
                  unselect(inBuffer.map((entry) => entry._id))
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

      if (detailed) {
        if (!detailed.isVillage) {
          const area = geoData.areas.features.find((item) =>
            item.properties._id === detailed._id
          )
          if (area) {
            this.featureGroup.addLayer(L.geoJson(area, {
              pane: 'custom-pane-layers',
              style: (feature) => ({ className: 'map-layer detailed' }),
              onEachFeature: (feature, layer) => {
                layer.on({
                  click: () => { showDetails() },
                  contextmenu: () => { showDetails() }
                })
              }
            }))
          }
        } else {
          // it's a village
          const point = L.circle(detailed._latlon, {
            pane: 'custom-pane-markers',
            radius: RADIUS[detailed.type],
            className: 'map-marker detailed'
          })
          point.on({
            dblclick: (event) => {
              if (detailed.selected) {
                unselect([detailed._id])
              } else {
                select([detailed])
              }
              showDetails()
              L.DomEvent.stop(event)
            }
          })
          this.featureGroup.addLayer(point)
        }
      }
    })
  }

  fitToBounds () {
    this.map.whenReady(() => {
      setTimeout(() => {
        if (this.featureGroup.getLayers().length) {
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
  detailed: PropTypes.object,
  points: PropTypes.arrayOf(PropTypes.object),
  showDetails: PropTypes.func,
  select: PropTypes.func,
  unselect: PropTypes.func,
  intl: intlShape.isRequired
}

export default injectIntl(Map)
