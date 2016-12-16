//
// build clean lists with provinces, zones and areas boundaries
//

import * as topojson from 'topojson'
import shapes from '../../../../json/shapes.json'
import {capitalize} from '../../../utils'

const clean = (word) => ((word || '').toString().toUpperCase().replace(/[^A-Z0-9]/g, ''))
const isEqual = (a, b) => (clean(a) === clean(b))
const areEqual = (a, b, keys) => (keys.every((key) => isEqual(a[key], b[key])))

//
// Leaflet doesn't support topoJSON format, transform them to geoJSON format.
//
const provinces = topojson.feature(shapes, shapes.objects.provinces)
const zones = topojson.feature(shapes, shapes.objects.zones)
const areas = topojson.feature(shapes, shapes.objects.areas)

//
// include basic properties in features
//
const addBasic = (item) => {
  const props = item.properties

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

provinces.features.forEach(addBasic)
zones.features.forEach(addBasic)
areas.features.forEach(addBasic)

let locations = zones.features.map((item) => item.properties.ZS)
locations.sort()

export default {
  isEqual,
  areEqual,
  center: [ -4.4233379, 16.2113064 ],
  zoom: 7,
  provinces,
  zones,
  areas,
  locations
}
