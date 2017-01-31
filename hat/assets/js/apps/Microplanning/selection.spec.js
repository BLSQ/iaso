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
          payload: [{id: 1}]
        }),
        { ...initialState, selectedItems: [{id: 1}] })
    })

    it('should include item in selected list at first position', () => {
      assert.deepEqual(
        reducer({
          ...initialState,
          selectedItems: [{id: 1}, {id: 2}, {id: 3}, {id: 4}]
        }, {
          type: selection.SELECT_ITEMS,
          payload: [{id: 9}]
        }),
        { ...initialState, selectedItems: [{id: 9}, {id: 1}, {id: 2}, {id: 3}, {id: 4}] })
    })

    it('should not include item in selected list if it is already there', () => {
      assert.deepEqual(
        reducer({
          ...initialState,
          selectedItems: [{id: 1}, {id: 2}, {id: 3}, {id: 4}]
        }, {
          type: selection.SELECT_ITEMS,
          payload: [{id: 3}]
        }),
        { ...initialState, selectedItems: [{id: 1}, {id: 2}, {id: 3}, {id: 4}] })
    })

    it('should include items in empty selected list in reverse order', () => {
      assert.deepEqual(
        reducer(undefined, {
          type: selection.SELECT_ITEMS,
          payload: [{id: 1}, {id: 2}, {id: 2}, {id: 4}]
        }),
        { ...initialState, selectedItems: [{id: 4}, {id: 2}, {id: 1}] })
    })

    it('should include non repeated items in selected list in reverse order', () => {
      assert.deepEqual(
        reducer({
          ...initialState,
          selectedItems: [{id: 1}, {id: 2}, {id: 3}, {id: 4}]
        }, {
          type: selection.SELECT_ITEMS,
          payload: [{id: 5}, {id: 2}, {id: 8}, {id: 5}]
        }),
        { ...initialState, selectedItems: [{id: 8}, {id: 5}, {id: 1}, {id: 2}, {id: 3}, {id: 4}] })
    })

    it('should remove item from selected list', () => {
      assert.deepEqual(
        reducer({
          ...initialState,
          selectedItems: [{id: 1}, {id: 2}, {id: 3}, {id: 4}]
        }, {
          type: selection.DESELECT_ITEMS,
          payload: [{id: 1}]
        }),
        { ...initialState, selectedItems: [{id: 2}, {id: 3}, {id: 4}] })

      assert.deepEqual(
        reducer({
          ...initialState,
          selectedItems: [{id: 1}, {id: 2}, {id: 3}, {id: 4}]
        }, {
          type: selection.DESELECT_ITEMS,
          payload: [{id: 3}]
        }),
        { ...initialState, selectedItems: [{id: 1}, {id: 2}, {id: 4}] })

      assert.deepEqual(
        reducer({
          ...initialState,
          selectedItems: [{id: 1}, {id: 2}, {id: 3}, {id: 4}]
        }, {
          type: selection.DESELECT_ITEMS,
          payload: [{id: 9}]
        }),
        { ...initialState, selectedItems: [{id: 1}, {id: 2}, {id: 3}, {id: 4}] })
    })

    it('should remove items from selected list', () => {
      assert.deepEqual(
        reducer({
          ...initialState,
          selectedItems: [{id: 1}, {id: 2}, {id: 3}, {id: 4}]
        }, {
          type: selection.DESELECT_ITEMS,
          payload: [{id: 1}, {id: 2}, {id: 2}, {id: 6}, {id: 8}]
        }),
        { ...initialState, selectedItems: [{id: 3}, {id: 4}] })
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
