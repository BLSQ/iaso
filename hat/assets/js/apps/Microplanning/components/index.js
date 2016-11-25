//
// First "import" and after "export"
// Fixes: "Can't make class hot reloadable due to being read-only"
// https://github.com/gaearon/react-hot-loader/issues/158
//

import {default as MapLegend} from './MapLegend'
import {default as MapSelectionControl} from './MapSelectionControl'
import {default as MapSelectionList} from './MapSelectionList'
import {default as MapTooltip} from './MapTooltip'
import {default as Map} from './Map'

export {
  Map,
  MapLegend,
  MapSelectionControl,
  MapSelectionList,
  MapTooltip
}
