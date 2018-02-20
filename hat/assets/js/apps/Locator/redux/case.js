/*
 * Includes the actions and state necessary for the villageFilters process
 */

export const SET_CASE = 'hat/locator/cases/SET_CASE'


// Note: `TypeError: Object.values is not a function` in tests :'(

export const setCase = kase => ({
  type: SET_CASE,
  payload: kase
})

export const caseActions = {
  setCase
}

export const caseReducer = (state = {}, action = {}) => {
  switch (action.type) {
    case SET_CASE: {
      const newState = action.payload
      return {...newState}
    }

    default:
      return state
  }
}
