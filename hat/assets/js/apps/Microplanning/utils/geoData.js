//
// build clean lists with areas boundaries and villages
//

import L from 'leaflet'
import * as topojson from 'topojson'
import zonesTopo from '../../../../json/zones.json'
import areasTopo from '../../../../json/areas.json'
import villages from '../../../../json/villages.json'

// TO BE CHANGED AFTER WORKSHOP
// const MAP_CENTER = [ -4.4233379, 16.2113064 ]
// const MAP_ZOOM = 7
const MAP_CENTER = [-4.001260, 18.171387]
const MAP_ZOOM = 8
// !TO BE CHANGED AFTER WORKSHOP

//
// Leaflet doesn't support topoJSON format, transform them to geoJSON format.
//
const zones = topojson.feature(zonesTopo, zonesTopo.objects.zones)
const areas = topojson.feature(areasTopo, areasTopo.objects.areas)

// TO BE REMOVED AFTER WORKSHOP: show only PRIORITY zones
const WORKSHOP = [
  'MOSANGO',
  'YASA BONGA',
  'YASSA BONGA',
  'BOKORO',
  'KIKONGO',
  'BULUNGU',
  'KIMPUTU'
]
areas.features = areas.features.filter((item) => WORKSHOP.indexOf(item.properties.zone) > -1)
// !TO BE REMOVED AFTER WORKSHOP

//
// include new properties based on other ones
//
const locations = villages
  // TO BE REMOVED AFTER WORKSHOP
  .filter((item) => WORKSHOP.indexOf(item.zone) > -1)
  // !TO BE REMOVED AFTER WORKSHOP
  .map((item) => {
    // create fake `_id` based on assumed uniqueness location
    const _id = item.lat.toFixed(8).toString() + ':' + item.lon.toFixed(8).toString()
    const _latlon = L.latLng(item.lat, item.lon)
    const _label = item.village // used in tooltip

    // indicate `type` based on `official` and `village` values
    let type
    if (item.official === 'YES') {
      type = 'official'
    } else if (item.official === 'NO') {
      type = 'other'
    } else if (item.village === 'Inconnu') {
      type = 'unknown'
    } else {
      type = '---' // this should never happen
    }

    return {...item, type, _id, _label, _latlon, isVillage: true}
  })

//
// calculate aggregated population, number of villages...
//
const aggregated = (item) => {
  const props = item.properties
  // create fake `_id`
  props._id = props.zone + ':' + (props.area || '')
  props._keys = (props.area ? ['zone', 'area'] : ['zone'])
  props._label = props.zone + (props.area ? ' - ' + props.area : '')

  const list = locations.filter((entry) => (
    props._keys.every((key) => entry[key] === props[key])
  ))

  if (list.length) {
    props.population = list.reduce((prev, curr) => (prev + (curr.population || 0)), 0)
    props.villagesOfficial = list.filter((village) => (village.type === 'official')).length
    props.villagesOther = list.filter((village) => (village.type === 'other')).length
    props.villagesUnknown = list.filter((village) => (village.type === 'unknown')).length
  }
}

// include aggregated data from villages
zones.features.forEach(aggregated)
areas.features.forEach(aggregated)

export default {
  center: MAP_CENTER,
  zoom: MAP_ZOOM,
  zones: zones,
  areas: areas,
  villages: locations
}
