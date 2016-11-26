/* global describe, it */
import assert from 'assert'
import * as selection from './selection'

describe('Microplanning selection', () => {
  describe('actions', () => {
    it('should create the select items action', () => {
      assert.deepEqual(
        selection.selectItems([1, 2, 3]),
        {type: selection.SELECT_ITEMS, payload: [1, 2, 3]})
    })

    it('should create the deselect items action', () => {
      assert.deepEqual(
        selection.deselectItems([1, 2, 3]),
        {type: selection.DESELECT_ITEMS, payload: [1, 2, 3]})
    })

    it('should create the reset selection action', () => {
      assert.deepEqual(
        selection.deselectItems(),
        {type: selection.DESELECT_ITEMS, payload: undefined})
    })
  })

  describe('reducer', () => {
    const reducer = selection.selectionReducer
    const initialState = selection.selectionInitialState

    it('should return the default state', () => {
      assert.deepEqual(reducer(), initialState)
    })

    it('should include item in empty selected list', () => {
      assert.deepEqual(
        reducer(undefined, {
          type: selection.SELECT_ITEMS,
          payload: [{_id: 1}]
        }),
        { ...initialState, selectedItems: [{_id: 1}] })
    })

    it('should include item in selected list at first position', () => {
      assert.deepEqual(
        reducer({
          ...initialState,
          selectedItems: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}]
        }, {
          type: selection.SELECT_ITEMS,
          payload: [{_id: 9}]
        }),
        { ...initialState, selectedItems: [{_id: 9}, {_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}] })
    })

    it('should not include item in selected list if it is already there', () => {
      assert.deepEqual(
        reducer({
          ...initialState,
          selectedItems: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}]
        }, {
          type: selection.SELECT_ITEMS,
          payload: [{_id: 3}]
        }),
        { ...initialState, selectedItems: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}] })
    })

    it('should include items in empty selected list in reverse order', () => {
      assert.deepEqual(
        reducer(undefined, {
          type: selection.SELECT_ITEMS,
          payload: [{_id: 1}, {_id: 2}, {_id: 2}, {_id: 4}]
        }),
        { ...initialState, selectedItems: [{_id: 4}, {_id: 2}, {_id: 1}] })
    })

    it('should include non repeated items in selected list in reverse order', () => {
      assert.deepEqual(
        reducer({
          ...initialState,
          selectedItems: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}]
        }, {
          type: selection.SELECT_ITEMS,
          payload: [{_id: 5}, {_id: 2}, {_id: 8}, {_id: 5}]
        }),
        { ...initialState, selectedItems: [{_id: 8}, {_id: 5}, {_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}] })
    })

    it('should remove item from selected list', () => {
      assert.deepEqual(
        reducer({
          ...initialState,
          selectedItems: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}]
        }, {
          type: selection.DESELECT_ITEMS,
          payload: [{_id: 1}]
        }),
        { ...initialState, selectedItems: [{_id: 2}, {_id: 3}, {_id: 4}] })

      assert.deepEqual(
        reducer({
          ...initialState,
          selectedItems: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}]
        }, {
          type: selection.DESELECT_ITEMS,
          payload: [{_id: 3}]
        }),
        { ...initialState, selectedItems: [{_id: 1}, {_id: 2}, {_id: 4}] })

      assert.deepEqual(
        reducer({
          ...initialState,
          selectedItems: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}]
        }, {
          type: selection.DESELECT_ITEMS,
          payload: [{_id: 9}]
        }),
        { ...initialState, selectedItems: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}] })
    })

    it('should remove items from selected list', () => {
      assert.deepEqual(
        reducer({
          ...initialState,
          selectedItems: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}]
        }, {
          type: selection.DESELECT_ITEMS,
          payload: [{_id: 1}, {_id: 2}, {_id: 2}, {_id: 6}, {_id: 8}]
        }),
        { ...initialState, selectedItems: [{_id: 3}, {_id: 4}] })
    })

    it('should delete all selected items', () => {
      assert.deepEqual(
        reducer(undefined, {type: selection.DESELECT_ITEMS}),
        { ...initialState, selectedItems: [] })

      assert.deepEqual(
        reducer({...initialState, selectedItems: [1, 2, 3]}, {type: selection.DESELECT_ITEMS}),
        { ...initialState, selectedItems: [] })
    })
  })
})
