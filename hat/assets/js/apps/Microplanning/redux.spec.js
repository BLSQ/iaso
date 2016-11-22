/* global describe, it */
import assert from 'assert'
import * as redux from './redux'

describe('Microplanning actions', () => {
  describe('actions', () => {
    it('should create the select villages action', () => {
      assert.deepEqual(
        redux.selectVillages([1, 2, 3]),
        {type: redux.SELECT_VILLAGES, payload: [1, 2, 3]})
    })

    it('should create the unselect villages action', () => {
      assert.deepEqual(
        redux.unselectVillages([1, 2, 3]),
        {type: redux.UNSELECT_VILLAGES, payload: [1, 2, 3]})
    })

    it('should create the reset selection action', () => {
      assert.deepEqual(
        redux.unselectVillages(),
        {type: redux.UNSELECT_VILLAGES, payload: undefined})
    })

    it('should create the set buffer size action', () => {
      assert.deepEqual(
        redux.setBuffer(100),
        {type: redux.SET_BUFFER_SIZE, payload: 100})
    })
  })

  describe('reducer', () => {
    const reducer = redux.microplanningReducer
    const initialState = redux.initialState

    it('should return the default state', () => {
      assert.deepEqual(reducer(), initialState)
    })

    it('should include item in empty selected list', () => {
      assert.deepEqual(
        reducer(undefined, {
          type: redux.SELECT_VILLAGES,
          payload: [{_id: 1}]
        }),
        { ...initialState, selected: [{_id: 1}] })
    })

    it('should include item in selected list at first position', () => {
      assert.deepEqual(
        reducer({
          ...initialState,
          selected: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}]
        }, {
          type: redux.SELECT_VILLAGES,
          payload: [{_id: 9}]
        }),
        { ...initialState, selected: [{_id: 9}, {_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}] })
    })

    it('should not include item in selected list if it is already there', () => {
      assert.deepEqual(
        reducer({
          ...initialState,
          selected: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}]
        }, {
          type: redux.SELECT_VILLAGES,
          payload: [{_id: 3}]
        }),
        { ...initialState, selected: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}] })
    })

    it('should include items in empty selected list in reverse order', () => {
      assert.deepEqual(
        reducer(undefined, {
          type: redux.SELECT_VILLAGES,
          payload: [{_id: 1}, {_id: 2}, {_id: 2}, {_id: 4}]
        }),
        { ...initialState, selected: [{_id: 4}, {_id: 2}, {_id: 1}] })
    })

    it('should include non repeated items in selected list in reverse order', () => {
      assert.deepEqual(
        reducer({
          ...initialState,
          selected: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}]
        }, {
          type: redux.SELECT_VILLAGES,
          payload: [{_id: 5}, {_id: 2}, {_id: 8}, {_id: 5}]
        }),
        { ...initialState, selected: [{_id: 8}, {_id: 5}, {_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}] })
    })

    it('should remove item from selected list', () => {
      assert.deepEqual(
        reducer({
          ...initialState,
          selected: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}]
        }, {
          type: redux.UNSELECT_VILLAGES,
          payload: [{_id: 1}]
        }),
        { ...initialState, selected: [{_id: 2}, {_id: 3}, {_id: 4}] })

      assert.deepEqual(
        reducer({
          ...initialState,
          selected: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}]
        }, {
          type: redux.UNSELECT_VILLAGES,
          payload: [{_id: 3}]
        }),
        { ...initialState, selected: [{_id: 1}, {_id: 2}, {_id: 4}] })

      assert.deepEqual(
        reducer({
          ...initialState,
          selected: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}]
        }, {
          type: redux.UNSELECT_VILLAGES,
          payload: [{_id: 9}]
        }),
        { ...initialState, selected: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}] })
    })

    it('should remove items from selected list', () => {
      assert.deepEqual(
        reducer({
          ...initialState,
          selected: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}]
        }, {
          type: redux.UNSELECT_VILLAGES,
          payload: [{_id: 1}, {_id: 2}, {_id: 2}, {_id: 6}, {_id: 8}]
        }),
        { ...initialState, selected: [{_id: 3}, {_id: 4}] })
    })

    it('should delete all selected items', () => {
      assert.deepEqual(
        reducer(undefined, {type: redux.UNSELECT_VILLAGES}),
        { ...initialState, selected: [] })

      assert.deepEqual(
        reducer({...initialState, selected: [1, 2, 3]}, {type: redux.UNSELECT_VILLAGES}),
        { ...initialState, selected: [] })
    })
  })
})
