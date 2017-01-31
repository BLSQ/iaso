//
// build clean lists with provinces, zones and areas boundaries
//

import * as topojson from 'topojson'
import shapes from '../../../../json/shapes.json'
import {capitalize} from '../../../utils'

const clean = (word) => ((word || '').toString().toUpperCase().replace(/[^A-Z0-9]/g, ''))
const isEqual = (a, b) => (clean(a) === clean(b))
const areEqual = (a, b, keys) => (keys.every((key) => isEqual(a[key], b[key])))
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

const divisions = [ 'province', 'zone', 'area' ]
const data = {}
divisions.forEach((type) => {
  // Leaflet doesn't support topoJSON format, transform them to geoJSON format.
  data[type] = topojson.feature(shapes, shapes.objects[type + 's'])
  // include basic properties in features
  data[type].features.forEach(addBasic)
})

// use zones as locations list in filters
let locations = data.zone.features.map((item) => item.properties.ZS)
locations.sort()

export default {
  isEqual,
  areEqual,
  center: [ -4.4233379, 16.2113064 ],
  zoom: 7,
  divisions,
  data,
  locations
}
