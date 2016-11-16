//
// build clean lists with areas boundaries and villages
//

import L from 'leaflet'
import * as topojson from 'topojson'
import areasTopo from '../../../../json/areas.json'
import villages from '../../../../json/villages.json'

const MAP_CENTER = [ -4.4233379, 16.2113064 ]
const MAP_ZOOM = 7

//
// Leaflet doesn't support topoJSON format, transform them to geoJSON layers.
//
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
const locations = villages.filter((item) => WORKSHOP.indexOf(item.zone) > -1)
// !TO BE REMOVED AFTER WORKSHOP
// const locations = villages

//
// modify villages list based on other properties
//
locations.forEach((item) => {
  // create fake `_id` based on assumed uniqueness location
  item._id = item.lat.toString() + ':' + item.lon.toString()
  item._latlon = L.latLng(item.lat, item.lon)
  item.isVillage = true // used in tooltip...

  // indicate `type` based on `official` and `village` values
  if (item.official === 'YES') {
    item.type = 'official'
  } else if (item.official === 'NO') {
    item.type = 'other'
  } else if (item.village === 'Inconnu') {
    item.type = 'unknown'
  } else {
    item.type = '---' // this should never happen
  }
})

//
// calculate aggregated population, number of villages...
//
const aggregateBy = (keys) => {
  return (item) => {
    const props = item.properties
    // create fake `_id`
    props._id = props.zone + ':' + props.area

    const list = locations.filter((entry) => (
      keys.every((key) => entry[key] === props[key])
    ))

    if (list.length) {
      props.population = list.reduce((prev, curr) => (prev + (curr.population || 0)), 0)
      props.villages = {
        list: list,
        official: list.filter((village) => (village.type === 'official')).length,
        other: list.filter((village) => (village.type === 'other')).length,
        unknown: list.filter((village) => (village.type === 'unknown')).length
      }
    }
  }
}

// include aggregated data from villages
areas.features.forEach(aggregateBy(['zone', 'area']))

export default {
  center: MAP_CENTER,
  zoom: MAP_ZOOM,
  areas: areas,
  villages: locations
}
