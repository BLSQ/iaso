//
// build a clean list with Zone de Sante boundaries and its villages
//

import topoData from '../../json/ZS-Bandundu-topo.json'
import locations from '@ehealthafrica/sense-hat-locations'

//
// Extract all the villages from the locations list
//

const villages = locations.reduce((flattenZones, zone) => {
  return flattenZones.concat(zone.areas.reduce((flattenAreas, area) => {
    return flattenAreas.concat(area.villages
      .filter((village) => (village.lon * village.lat !== 0))
      .map((village) => ({
        zone: zone.name,
        area: area.name,
        village: village.name,
        lat: village.lat,
        lon: village.lon
      })))
  }, []))
}, [])

const MAP_CENTER = [ -4.4233379, 16.2113064 ]
const MAP_ZOOM = 7

export default {
  center: MAP_CENTER,
  zoom: MAP_ZOOM,
  zones: topoData,
  villages: {
    mobile: villages
  }
}
