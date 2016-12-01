//
// build clean lists with zones and areas boundaries
//

import * as topojson from 'topojson'
import zonesTopo from '../../../../json/zones.json'
import areasTopo from '../../../../json/areas.json'
import data2015 from '../../../../json/PNLTHA-2015.json'
import {capitalize} from '../../../utils'

const clean = (word) => ((word || '').toString().toUpperCase().replace(/[^A-Z0-9]/g, ''))
const isEqual = (a, b) => (clean(a) === clean(b))
const areEqual = (a, b, keys) => (keys.every((key) => isEqual(a[key], b[key])))

//
// Leaflet doesn't support topoJSON format, transform them to geoJSON format.
//
const zones = topojson.feature(zonesTopo, zonesTopo.objects.zones)
const areas = topojson.feature(areasTopo, areasTopo.objects.areas)

//
// include basic properties in features
//
const addBasic = (item) => {
  const props = item.properties

  // create fake `id` based on health structure divisions
  props.id = clean(props.province) + ':' + clean(props.ZS) + ':' + clean(props.AS)
  props._keys = (props.AS ? ['ZS', 'AS'] : ['ZS'])

  props.province = capitalize(props.province)
  props.ZS = capitalize(props.ZS)
  if (props.AS) props.AS = capitalize(props.AS)
  props.label = props.province + ' - ' + props.ZS + (props.AS ? ' - ' + props.AS : '')
}

zones.features.forEach(addBasic)
areas.features.forEach(addBasic)

let locations = zones.features.map((item) => item.properties.ZS)
locations.sort()

export default {
  isEqual,
  areEqual,
  center: [ -4.4233379, 16.2113064 ],
  zoom: 7,
  zones,
  areas,
  locations,
  data2015
}
