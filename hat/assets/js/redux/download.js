export const DOWNLOAD = 'hat/data/DOWNLOAD'
// export const DOWNLOAD_STATUS = 'hat/data/DOWNLOAD_STATUS'
export const DOWNLOAD_SUCCESS = 'hat/data/DOWNLOAD_SUCCESS'
export const DOWNLOAD_ERROR = 'hat/data/DOWNLOAD_ERROR'
export const DOWNLOAD_RESET = 'hat/data/DOWNLOAD_RESET'

// export const STATUS_STARTED = 'started'
// export const STATUS_SUCCESS = 'done'
// export const STATUS_

export const downloadReducer = function (state = {}, action = {}) {
  switch (action.type) {
    case DOWNLOAD:
      return {
        ...state,
        loading: true,
        error: false,
        resultUrl: null
      }
    case DOWNLOAD_SUCCESS:
      return {
        ...state,
        loading: false,
        resultUrl: action.payload
      }
    case DOWNLOAD_ERROR:
      return {
        ...state,
        loading: false,
        error: true,
        resultUrl: null
      }
    case DOWNLOAD_RESET:
      return {
        loading: false,
        error: false,
        resultUrl: null
      }
    default:
      return state
  }
}
