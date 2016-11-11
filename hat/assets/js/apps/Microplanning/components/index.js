//
// First "import" and after "export"
// Fixes: "Can't make class hot reloadable due to being read-only"
// https://github.com/gaearon/react-hot-loader/issues/158
//

import {default as DataSelected} from './DataSelected'
import {default as Map} from './Map'
import {default as MapLegend} from './MapLegend'
import {default as MapTooltip} from './MapTooltip'

export {
  DataSelected,
  Map,
  MapLegend,
  MapTooltip
}
