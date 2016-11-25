export const SELECT_ITEMS = 'hat/microplanning/selection/SELECT_ITEMS'
export const DESELECT_ITEMS = 'hat/microplanning/selection/DESELECT_ITEMS'

export const selectItems = (items) => ({
  type: SELECT_ITEMS,
  payload: items
})

export const deselectItems = (ids) => ({
  type: DESELECT_ITEMS,
  payload: ids
})

export const selectionInitialState = { selectedItems: [] }

export const selectionReducer = (state = selectionInitialState, action = {}) => {
  switch (action.type) {
    case SELECT_ITEMS: {
      let selectedItems = state.selectedItems || []
      const _find = (list, item) => (list.find((entry) => entry._id === item._id))
      action.payload.forEach((item) => {
        if (!_find(selectedItems, item)) {
          selectedItems = [item, ...selectedItems]
        }
      })

      return {...state, selectedItems}
    }

    case DESELECT_ITEMS: {
      if (!action.payload || action.payload.length === 0) {
        return {...state, selectedItems: []}
      }

      const selectedItems = state.selectedItems || []
      const ids = action.payload.map((item) => item._id)
      const condition = (entry) => (ids.indexOf(entry._id) === -1)
      return {...state, selectedItems: selectedItems.filter(condition)}
    }

    default:
      return state
  }
}
