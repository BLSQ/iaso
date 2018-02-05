/*
 * Includes the actions and state necessary for the villageFilters process
 */

export const LOAD_PROVINCES = 'hat/locator/villagefilters/LOAD_PROVINCES'
export const LOAD_AREAS = 'hat/locator/villagefilters/LOAD_AREAS'
export const LOAD_ZONES = 'hat/locator/villagefilters/LOAD_ZONES'
export const LOAD_VILLAGES = 'hat/locator/villagefilters/LOAD_VILLAGES'
export const SElECT_VILLAGE = 'hat/locator/villagefilters/SElECT_VILLAGE'
export const KEY_TYPED = 'hat/locator/villagefilters/KEY_TYPED'
export const KEY_DELETED = 'hat/locator/villagefilters/KEY_DELETED'

export const loadProvinces = payload => ({
  type: LOAD_PROVINCES,
  payload: payload
})

export const loadAreas = payload => ({
  type: LOAD_AREAS,
  payload: payload
})

export const loadZones = payload => ({
  type: LOAD_ZONES,
  payload: payload
})

export const loadVillages = payload => ({
  type: LOAD_VILLAGES,
  payload: payload
})

export const selectVillage = villageId => ({
  type: SElECT_VILLAGE,
  payload: villageId
})

export const villageFiltersActions = {
  loadProvinces,
  loadAreas,
  loadZones,
  loadVillages,
  selectVillage
}

export const villageFiltersInitialState = {
  provinceId: null,
  zoneId: null,
  areaId: null,
  villageId: null,
  key: null,
  provinces: [],
  zones: [],
  areas: [],
  villages: []
}

export const villageFiltersReducer = (state = villageFiltersInitialState, action = {}) => {
  console.log("ACTION", action)
  switch (action.type) {
    case LOAD_PROVINCES: {
      const provinces = action.payload
      return {...state, provinces, zones: [], areas: [], villages:[]}
    }
    case LOAD_ZONES: {
      const zones = action.payload.zones
      const provinceId = action.payload.provinceId
      console.log("LOAD_ZONES", {...state, zones, provinceId, areas: [], villages:[]})
      return {...state, zones, provinceId, areas: [], villages:[]}
    }
    case LOAD_AREAS: {
      const areas = action.payload.areas
      const zoneId = action.payload.zoneId
      return {...state, areas, zoneId, villages:[]}
    }
    case LOAD_VILLAGES: {
      const villages = action.payload.villages
      const areaId = action.payload.areaId
      return {...state, villages, areaId}
    }
    case SElECT_VILLAGE: {
      const villageId = action.payload
      return {...state, villageId}
    }
    default:
      return state
  }
}
