export const SELECT_VILLAGES = 'hat/microplanning/SELECT_VILLAGES'
export const UNSELECT_VILLAGES = 'hat/microplanning/UNSELECT_VILLAGES'

export const FILTER_VILLAGES = 'hat/microplanning/FILTER_VILLAGES'
export const SET_BUFFER_SIZE = 'hat/microplanning/SET_BUFFER_SIZE'

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
  type: SET_BUFFER_SIZE,
  payload: value
})

export const actions = {
  selectVillages,
  unselectVillages,
  filterVillages,
  setBuffer
}

export const initialState = {
  selected: [],
  buffer: 5000, // metres (5km)
  filter: { official: true, other: false, unknown: false }
}

export const microplanningReducer = (state = initialState, action = {}) => {
  switch (action.type) {
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

    case SET_BUFFER_SIZE: {
      return {...state, buffer: parseInt(action.payload, 10)}
    }

    default:
      return state
  }
}
