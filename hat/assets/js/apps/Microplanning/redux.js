import geoData from './utils/geoData'

export const SHOW_DETAILS = 'hat/microplanning/SHOW_DETAILS'
export const SELECT_VILLAGE = 'hat/microplanning/SELECT_VILLAGE'
export const UNSELECT_VILLAGE = 'hat/microplanning/UNSELECT_VILLAGE'
export const RESET_SELECTION = 'hat/microplanning/RESET_SELECTION'

export const SHOW_AREA = 'hat/microplanning/SHOW_AREA'
export const HIDE_AREA = 'hat/microplanning/HIDE_AREA'

export const showDetails = (item) => ({
  type: SHOW_DETAILS,
  payload: item
})

export const selectVillage = (item) => ({
  type: SELECT_VILLAGE,
  payload: item
})

export const unselectVillage = (id) => ({
  type: UNSELECT_VILLAGE,
  payload: id
})

export const resetSelection = () => ({
  type: RESET_SELECTION
})

export const showAreaVillages = (zone, area) => ({
  type: SHOW_AREA,
  payload: {zone, area}
})

export const hideAreaVillages = (zone, area) => ({
  type: HIDE_AREA,
  payload: {zone, area}
})

export const actions = {
  showDetails,
  selectVillage,
  unselectVillage,
  resetSelection,
  showAreaVillages,
  hideAreaVillages
}

export const microplanningReducer = (state = {}, action = {}) => {
  switch (action.type) {
    case SHOW_DETAILS: {
      return {...state, detailed: action.payload}
    }

    case SELECT_VILLAGE: {
      const selected = state.selected || []
      const item = selected.find((entry) => entry._id === action.payload._id)
      if (!item) {
        // new village at first position
        return {...state, selected: [action.payload, ...selected]}
      }
      // ignore action
      return state
    }

    case UNSELECT_VILLAGE: {
      const selected = state.selected || []
      const condition = (entry) => (entry._id !== action.payload)
      return {...state, selected: selected.filter(condition)}
    }

    case RESET_SELECTION:
      return {...state, selected: []}

    case SHOW_AREA: {
      // search the villages and include them
      const plotted = state.plotted || []
      const condition = (item) => (
        item.zone === action.payload.zone &&
        item.area === action.payload.area)

      const inList = plotted.filter(condition)
      if (inList.length === 0) {
        const list = geoData.villages.filter(condition)
        return {...state, plotted: plotted.concat(list)}
      }
      // ignore action
      return state
    }

    case HIDE_AREA: {
      // search the villages and exclude them
      const plotted = state.plotted || []
      const condition = (item) => (
        item.zone !== action.payload.zone ||
        item.area !== action.payload.area)

      return {...state, plotted: plotted.filter(condition)}
    }

    default:
      return state
  }
}
