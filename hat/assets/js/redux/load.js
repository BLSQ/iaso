export const LOAD = 'hat/data/LOAD'
export const LOAD_SUCCESS = 'hat/data/LOAD_SUCCESS'
export const LOAD_SUCCESS_NO_DATA = 'hat/data/LOAD_SUCCESS_NO_DATA'
export const LOAD_ERROR = 'hat/data/LOAD_ERROR'

export const loadReducer = function (state = {}, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        loading: true
      }
    case LOAD_SUCCESS:
      return {
        ...state,
        loading: false,
        data: action.payload
      }

    case LOAD_SUCCESS_NO_DATA:
      return {
        ...state,
        loading: false
      }

    case LOAD_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload
      }
    default:
      return state
  }
}
