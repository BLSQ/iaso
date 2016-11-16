import geoData from './utils/geoData'

export const SHOW_DETAILS = 'hat/microplanning/SHOW_DETAILS'
export const PLOT_DETAILS_VILLAGES = 'hat/microplanning/PLOT_DETAILS_VILLAGES'
export const UNPLOT_DETAILS_VILLAGES = 'hat/microplanning/UNPLOT_DETAILS_VILLAGES'

export const SELECT_VILLAGES = 'hat/microplanning/SELECT_VILLAGES'
export const UNSELECT_VILLAGES = 'hat/microplanning/UNSELECT_VILLAGES'

export const FILTER_VILLAGES = 'hat/microplanning/FILTER_VILLAGES'
export const SET_BUFFER = 'hat/microplanning/SET_BUFFER'

export const showDetails = (item, centered) => ({
  type: SHOW_DETAILS,
  payload: {item, centered}
})

export const plotDetailsVillages = () => ({
  type: PLOT_DETAILS_VILLAGES
})

export const unplotDetailsVillages = () => ({
  type: UNPLOT_DETAILS_VILLAGES
})

export const selectVillages = (items) => ({
  type: SELECT_VILLAGES,
  payload: items
})

export const unselectVillages = (ids) => ({
  type: UNSELECT_VILLAGES,
  payload: ids
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
  plotDetailsVillages,
  unplotDetailsVillages,
  selectVillages,
  unselectVillages,
  filterVillages,
  setBuffer
}

export const microplanningReducer = (state = {}, action = {}) => {
  switch (action.type) {
    case SHOW_DETAILS: {
      return {
        ...state,
        details: action.payload.item,
        centered: (action.payload.item && action.payload.centered || false)
      }
    }

    case PLOT_DETAILS_VILLAGES: {
      if (!state.details) return state

      // search the villages and include them
      const plotted = state.plotted || []
      const condition = (item) => (
        item.zone === state.details.zone &&
        (!state.details.area || item.area === state.details.area))

      if (plotted.filter(condition).length === 0) {
        const list = geoData.villages.filter(condition)
        return {...state, plotted: plotted.concat(list)}
      }
      // ignore action
      return state
    }

    case UNPLOT_DETAILS_VILLAGES: {
      if (!state.details) return state

      // search the villages and exclude them
      const plotted = state.plotted || []
      const condition = (item) => (
        item.zone !== state.details.zone ||
        item.area !== state.details.area)

      return {...state, plotted: plotted.filter(condition)}
    }

    case SELECT_VILLAGES: {
      let selected = state.selected || []
      const _find = (list, item) => (list.find((entry) => entry._id === item._id))
      action.payload.forEach((item) => {
        if (!_find(selected, item)) {
          selected = [item, ...selected]
        }
      })

      return {...state, selected}
    }

    case UNSELECT_VILLAGES: {
      if (!action.payload || action.payload.length === 0) {
        return {...state, selected: []}
      }

      const selected = state.selected || []
      const ids = action.payload.map((item) => item._id)
      const condition = (entry) => (ids.indexOf(entry._id) === -1)
      return {...state, selected: selected.filter(condition)}
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
