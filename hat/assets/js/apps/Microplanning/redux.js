import geoData from './utils/geoData'

export const SHOW_DETAILS = 'hat/microplanning/SHOW_DETAILS'
export const SELECT_VILLAGE = 'hat/microplanning/SELECT_VILLAGE'
export const SELECT_VILLAGES = 'hat/microplanning/SELECT_VILLAGE_BULK'
export const UNSELECT_VILLAGE = 'hat/microplanning/UNSELECT_VILLAGE'
export const UNSELECT_VILLAGES = 'hat/microplanning/UNSELECT_VILLAGE_BULK'
export const RESET_SELECTION = 'hat/microplanning/RESET_SELECTION'

export const SHOW_AREA = 'hat/microplanning/SHOW_AREA'
export const HIDE_AREA = 'hat/microplanning/HIDE_AREA'

export const FILTER_VILLAGES = 'hat/microplanning/FILTER_VILLAGES'
export const SET_BUFFER = 'hat/microplanning/SET_BUFFER'

export const showDetails = (item) => ({
  type: SHOW_DETAILS,
  payload: item
})

export const selectVillage = (item) => ({
  type: SELECT_VILLAGE,
  payload: item
})

export const selectVillages = (items) => ({
  type: SELECT_VILLAGES,
  payload: items
})

export const unselectVillage = (id) => ({
  type: UNSELECT_VILLAGE,
  payload: id
})

export const unselectVillages = (ids) => ({
  type: UNSELECT_VILLAGES,
  payload: ids
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

export const filterVillages = (filter) => ({
  type: FILTER_VILLAGES,
  payload: filter
})

export const setBuffer = (value) => ({
  type: SET_BUFFER,
  payload: value
})

export const actions = {
  showDetails,
  selectVillage,
  selectVillages,
  unselectVillage,
  unselectVillages,
  resetSelection,
  showAreaVillages,
  hideAreaVillages,
  filterVillages,
  setBuffer
}

export const microplanningReducer = (state = {}, action = {}) => {
  const _find = (list, item) => (list.find((entry) => entry._id === item._id))

  switch (action.type) {
    case SHOW_DETAILS: {
      return {...state, detailed: action.payload}
    }

    case SELECT_VILLAGE: {
      const selected = state.selected || []
      if (!_find(selected, action.payload)) {
        // new village at first position
        return {...state, selected: [action.payload, ...selected]}
      }
      // ignore action
      return state
    }

    case SELECT_VILLAGES: {
      let selected = state.selected || []

      action.payload.forEach((item) => {
        if (!_find(selected, item)) {
          selected = [item, ...selected]
        }
      })

      return {...state, selected}
    }

    case UNSELECT_VILLAGE: {
      const selected = state.selected || []
      const condition = (entry) => (entry._id !== action.payload)
      return {...state, selected: selected.filter(condition)}
    }

    case UNSELECT_VILLAGES: {
      const selected = state.selected || []
      const condition = (entry) => (action.payload.indexOf(entry._id) === -1)
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

      if (plotted.filter(condition).length === 0) {
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

    case FILTER_VILLAGES: {
      return {...state, filter: action.payload}
    }

    case SET_BUFFER: {
      return {...state, buffer: parseInt(action.payload, 10)}
    }

    default:
      return state
  }
}
