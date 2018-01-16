/*
 * Includes the actions and state necessary to display the map view
 */

export const UNKNOWN = 'hat/microplanning/leaflet/action/UNKNWON'
export const LEGEND_TOGGLE = 'hat/microplanning/leaflet/legend/TOGGLE'
export const BASE_LAYER_CHANGE = 'hat/microplanning/leaflet/base-layer/CHANGE'
export const OVERLAY_TOGGLE = 'hat/microplanning/leaftlet/overlay/TOGGLE'
export const FULLSCREEN_ACTIVATE = 'hat/microplanning/leaftlet/fullscreen/ACTIVATE'
export const FULLSCREEN_DEACTIVATE = 'hat/microplanning/leaftlet/fullscreen/DEACTIVATE'
export const LEAFLET_MAP = 'hat/microplanning/leaflet/MAP'

export const mapLayerTypes = {
  legend: 1,
  baseLayer: 2,
  overlay: 3
}

export const mapBaseLayers = [
  'blank',
  'osm',
  'arcgis-street',
  'arcgis-satellite',
  'arcgis-topo'
]

export const changeLayer = (layerType, payload) => {
  switch (layerType) {
    case mapLayerTypes.legend:
      return {
        type: LEGEND_TOGGLE,
        payload: payload
      }

    case mapLayerTypes.baseLayer:
      return {
        type: BASE_LAYER_CHANGE,
        payload: payload
      }

    case mapLayerTypes.overlay:
      return {
        type: OVERLAY_TOGGLE,
        payload: payload
      }

    default:
      return {type: UNKNOWN}
  }
}

export const toggleLegend = (legend) => ({
  type: LEGEND_TOGGLE,
  payload: legend
})

export const changeBaseLayer = (baseLayer) => ({
  type: BASE_LAYER_CHANGE,
  payload: baseLayer
})

export const toggleOverlay = (overlay) => ({
  type: OVERLAY_TOGGLE,
  payload: overlay
})

export const activateFullscreen = () => ({
  type: FULLSCREEN_ACTIVATE
})

export const deactivateFullscreen = () => ({
  type: FULLSCREEN_DEACTIVATE
})

export const setLeafletMap = (map) => ({
  type: LEAFLET_MAP,
  payload: map
})

export const mapActions = {
  activateFullscreen,
  changeBaseLayer,
  changeLayer,
  deactivateFullscreen,
  setLeafletMap,
  toggleLegend,
  toggleOverlay
}

export const mapInitialState = {
  legend: {
    YES: true
  },
  baseLayer: 'arcgis-topo',
  overlays: {
    labels: false
  },
  fullscreen: false
}

export const mapReducer = (state = mapInitialState, action = {}) => {
  switch (action.type) {
    case LEGEND_TOGGLE: {
      const {legend} = state
      const option = action.payload

      if (legend[option] === undefined) {
        return state
      }

      return {...state, legend: {...legend, [option]: !legend[option]}}
    }

    case BASE_LAYER_CHANGE: {
      const baseLayer = action.payload

      if (mapBaseLayers.indexOf(baseLayer) === -1) {
        return state
      }

      return {...state, baseLayer}
    }

    case OVERLAY_TOGGLE: {
      const {overlays} = state
      const option = action.payload

      if (overlays[option] === undefined) {
        return state
      }

      return {...state, overlays: {...overlays, [option]: !overlays[option]}}
    }

    case FULLSCREEN_ACTIVATE:
      return {...state, fullscreen: true}

    case FULLSCREEN_DEACTIVATE:
      return {...state, fullscreen: false}

    case LEAFLET_MAP:
      return {...state, leafletMap: action.payload}

    default:
      return state
  }
}
