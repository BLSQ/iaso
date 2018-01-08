//
// First "import" and after "export"
// Fixes: "Can't make class hot reloadable due to being read-only"
// https://github.com/gaearon/react-hot-loader/issues/158
//

import {default as Map} from './Map'
import {default as MapLayers} from './MapLayers'
import {default as MapLegend} from './MapLegend'
import {default as MapSelectionControl} from './MapSelectionControl'
import {default as MapSelectionExport} from './MapSelectionExport'
import {default as MapSelectionSummary} from './MapSelectionSummary'
import {default as MapSelectionList} from './MapSelectionList'
import {default as MapTooltip} from './MapTooltip'
import {default as TeamSelection} from './TeamSelection'

export {
  Map,
  MapLayers,
  MapLegend,
  MapSelectionControl,
  MapSelectionExport,
  MapSelectionList,
  MapSelectionSummary,
  MapTooltip,
  TeamSelection
}
