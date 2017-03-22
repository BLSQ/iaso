/*
 * Includes the actions and state necessary for the selection process
 */

export const SELECTION_DISABLED = 'hat/microplanning/selection/SELECTION_DISABLED'
export const SELECTION_MODE_CHANGE = 'hat/microplanning/selection/SELECTION_MODE_CHANGE'
export const SELECTION_EXECUTE = 'hat/microplanning/selection/EXECUTE'

export const BUFFER_SIZE_CHANGE = 'hat/microplanning/selection/BUFFER_SIZE_CHANGE'
export const HIGHLIGHT_BUFFER_SIZE_CHANGE = 'hat/microplanning/selection/HIGHLIGHT_BUFFER_SIZE_CHANGE'

export const SELECT_ITEMS = 'hat/microplanning/selection/SELECT_ITEMS'
export const DESELECT_ITEMS = 'hat/microplanning/selection/DESELECT_ITEMS'

export const DISPLAY_ITEM = 'hat/microplanning/selection/DISPLAY_ITEM'

export const selectionModes = {
  none: 0,
  select: 1,
  deselect: -1
}

// Note: `TypeError: Object.values is not a function` in tests :'(
const validSelectionModes = Object.keys(selectionModes).map((key) => selectionModes[key])

const calculateSelectedItems = (mode, suggestedItems, selectedItems) => {
  switch (mode) {
    case selectionModes.select: {
      const _find = (list, item) => (list.find((entry) => entry.id === item.id))

      // check one by one, if someone is repeated will be ignored
      suggestedItems.forEach((item) => {
        if (!_find(selectedItems, item)) {
          selectedItems = [item, ...selectedItems] // new elements go first
        }
      })

      return selectedItems
    }

    case selectionModes.deselect: {
      // no suggested means remove ALL
      if (suggestedItems.length === 0) {
        return []
      }
      // otherwise, remove indicated
      const ids = suggestedItems.map((item) => item.id)
      return selectedItems.filter((item) => (ids.indexOf(item.id) === -1))
    }
  }

  return selectedItems
}

export const disableSelection = () => (changeMode(selectionModes.none))

export const changeMode = (mode) => ({
  type: SELECTION_MODE_CHANGE,
  payload: mode
})

export const changeBufferSize = (size) => ({
  type: BUFFER_SIZE_CHANGE,
  payload: parseInt(size, 10)
})

export const changeHighlightBufferSize = (size) => ({
  type: HIGHLIGHT_BUFFER_SIZE_CHANGE,
  payload: parseInt(size, 10)
})

export const executeSelection = (items) => ({
  type: SELECTION_EXECUTE,
  payload: items
})

export const selectItems = (items) => ({
  type: SELECT_ITEMS,
  payload: items
})

export const deselectItems = (items) => ({
  type: DESELECT_ITEMS,
  payload: items
})

export const displayItem = (item) => ({
  type: DISPLAY_ITEM,
  payload: item
})

export const selectionActions = {
  changeBufferSize,
  changeHighlightBufferSize,
  changeMode,
  deselectItems,
  disableSelection,
  displayItem,
  executeSelection,
  selectItems
}

export const selectionInitialState = {
  mode: selectionModes.none,
  bufferSize: 1,
  highlightBufferSize: 1,
  selectedItems: [],
  displayedItem: null
}

export const selectionReducer = (state = selectionInitialState, action = {}) => {
  switch (action.type) {
    case SELECTION_MODE_CHANGE: {
      const mode = action.payload
      if (validSelectionModes.indexOf(mode) === -1) {
        return state
      }

      return {...state, mode}
    }

    case BUFFER_SIZE_CHANGE: {
      const bufferSize = action.payload
      if (bufferSize < 0) {
        return state
      }

      return {...state, bufferSize}
    }

    case HIGHLIGHT_BUFFER_SIZE_CHANGE: {
      const highlightBufferSize = action.payload
      if (highlightBufferSize < 0) {
        return state
      }

      return {...state, highlightBufferSize}
    }

    case SELECTION_EXECUTE: {
      return {
        ...state,
        selectedItems: calculateSelectedItems(
          state.mode,
          action.payload || [],
          state.selectedItems
        )
      }
    }

    case SELECT_ITEMS: {
      return {
        ...state,
        selectedItems: calculateSelectedItems(
          selectionModes.select,
          action.payload || [],
          state.selectedItems
        )
      }
    }

    case DESELECT_ITEMS: {
      return {
        ...state,
        selectedItems: calculateSelectedItems(
          selectionModes.deselect,
          action.payload || [],
          state.selectedItems
        )
      }
    }

    case DISPLAY_ITEM: {
      return {...state, displayedItem: action.payload}
    }

    default:
      return state
  }
}
