/*
 * - build clean lists with provinces, zones and areas boundaries
 * - common geo methods (extend properties, search in buffer...)
 */

import L from 'leaflet'
import * as topojson from 'topojson'

import shapes from './shapes.json'
import {capitalize} from '../../../utils'

const clean = (word) => ((word || '').toString().toUpperCase().replace(/[^A-Z0-9]/g, ''))
const isEqual = (a, b) => (clean(a) === clean(b))
const areEqual = (a, b, keys) => (keys.every((key) => isEqual(a[key], b[key])))
const extendBasic = (division) => {
  const props = division.properties

  // create fake `id` based on health structure divisions
  props.id = clean(props.NEW_PROV) + ':' + clean(props.ZS) + ':' + clean(props.AS)

  props.province = capitalize(props.NEW_PROV)
  props.formerProvince = capitalize(props.OLD_PROV)
  props.label = props.province
  props._keys = ['province']

  if (props.ZS) {
    props.ZS = capitalize(props.ZS)
    props.label += ' - ' + props.ZS
    props._keys = ['ZS']

    if (props.AS) {
      props.AS = capitalize(props.AS)
      props.label += ' - ' + props.AS
      props._keys = ['ZS', 'AS']
    }
  }
}

const divisions = [ 'province', 'zone', 'area' ]
const data = {}
divisions.forEach((type) => {
  // Leaflet doesn't support topoJSON format, transform them to geoJSON format.
  data[type] = topojson.feature(shapes, shapes.objects[type + 's'])
  // include basic properties in features
  data[type].features.forEach(extendBasic)
})

// circle size in metres depending on the village type
const RADIUS = {
  official: 350,
  other: 150,
  unknown: 150,
  highlight: 80 // amount to increase if there were cases
}

const extendDivisionInfo = (division, villages, legend) => {
  const countByType = (type) => (prev, curr) => (prev + (curr.type === type ? 1 : 0))
  const sum = (key) => (prev, curr) => (prev + (curr[key] || 0))
  const max = (key) => (prev, curr) => (!curr[key] || prev >= curr[key] ? prev : curr[key])

  // find the villages in shape and the plotted ones
  const inDivision = villages.filter((village) => areEqual(division, village, division._keys))
  const plotted = inDivision.filter((village) => legend[village.type])

  // find out the date of the last confirmed HAT case
  const lastConfirmedCaseDate = plotted.reduce(max('lastConfirmedCaseDate'), '')

  // find out the population and number of villages by type
  const population = inDivision.reduce(sum('population'), 0)
  const villagesOfficial = inDivision.reduce(countByType('official'), 0)
  const villagesOther = inDivision.reduce(countByType('other'), 0)
  const villagesUnknown = inDivision.reduce(countByType('unknown'), 0)

  return {
    ...division,
    lastConfirmedCaseDate,
    population,
    villagesOfficial,
    villagesOther,
    villagesUnknown
  }
}

const extendVillageInfo = (village) => {
  //console.log(village);
  const _latlon = L.latLng(village.latitude, village.longitude)
  const _isHighlight = (village.nr_positive_cases > 0)
  if (!village.type) {
    village.type = 'official';
  }
  // take size from village type and increase it if there are cases
  const _radius = RADIUS[village.type] + (_isHighlight ? RADIUS.highlight : 0)
  const _class = (_isHighlight ? 'highlight' : village.type)
  const _pane = (_isHighlight ? 'highlight' : 'markers')

  let label = village.label
  // if (_isHighlight) {
  //   // include last case info
  //   label += ' (' + village.lastConfirmedCaseYear +
  //            ', ' + village.confirmedCases + ')'
  // }

  return {...village, label, _isHighlight, _radius, _class, _pane, _latlon}
}

const villagesInBuffer = (plotted, buffer) => {
  const bufferRadius = buffer.getRadius()

  // find out the points within the buffer zone
  const latlon = buffer.getLatLng()
  const bounds = buffer.getBounds()
  const west = bounds.getWest()
  const east = bounds.getEast()
  const length = plotted.length

  const inBuffer = []
  for (let i = 0; i < length; i++) {
    // the villages are ordered by `longitude`

    // compare `longitude` with west and east
    // if the `longitude` is easter than the current position
    // then exit the loop
    const village = plotted[i]
    if (village.longitude < west) continue // ignore and continue
    if (village.longitude > east) break // exit the loop

    // compare distance
    const distance = latlon.distanceTo(village._latlon)
    if (distance <= (bufferRadius + village._radius)) {
      inBuffer.push(village)
    }
  }

  return inBuffer
}

const villagesInHighlightBuffer = (map, plotted, highlightBufferSize) => {
  if (highlightBufferSize === 0) {
    return plotted.filter((village) => village._isHighlight)
  }

  const length = plotted.length
  const bufferSize = 1000 * highlightBufferSize
  const bufferCircle = L.circle([0, 0], bufferSize)

  // circle needs to be in the map or `getBounds` will fail
  // https://github.com/Leaflet/Leaflet/issues/4629
  map.addLayer(bufferCircle)

  const inBuffer = []
  for (let i = 0; i < length; i++) {
    const villageA = plotted[i]
    if (villageA._isHighlight) {
      inBuffer.push(villageA)
    }

    // move and resize buffer circle
    const radius = villageA._radius + bufferSize
    bufferCircle._latlng = villageA._latlon
    bufferCircle.setRadius(radius)
    bufferCircle.redraw()

    const east = bufferCircle.getBounds().getEast()

    for (let j = i + 1; j < length; j++) {
      const villageB = plotted[j]

      // if the `longitude` is easter than the current position
      // then exit the loop
      if (villageB.longitude > east) break // exit the loop
      if (!villageA._isHighlight &&
          !villageB._isHighlight) continue // ignore and continue

      // compare distance
      const distance = villageB._latlon.distanceTo(villageA._latlon)
      if (distance <= (radius + villageB._radius)) {
        if (villageA._isHighlight) {
          inBuffer.push(villageB)
        } else {
          inBuffer.push(villageA)
        }
      }
    }
  }

  // remove circle afterwards
  map.removeLayer(bufferCircle)

  return inBuffer
}

export default {
  isEqual,
  areEqual,
  center: [ -4.4233379, 16.2113064 ],
  zoom: 7,
  divisions,
  data,
  extendDivisionInfo,
  extendVillageInfo,
  villagesInBuffer,
  villagesInHighlightBuffer
}
