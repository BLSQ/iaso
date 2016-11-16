/* global describe, it */
import assert from 'assert'
import * as redux from './redux'

describe('Microplanning actions', () => {
  describe('actions', () => {
    it('should create the show details action', () => {
      assert.deepEqual(
        redux.showDetails('item'),
        {type: redux.SHOW_DETAILS, payload: {item: 'item', centered: undefined}})
    })

    it('should create the plot villages in details action', () => {
      assert.deepEqual(
        redux.plotDetailsVillages(),
        {type: redux.PLOT_DETAILS_VILLAGES})
    })

    it('should create the unplot villages in details action', () => {
      assert.deepEqual(
        redux.unplotDetailsVillages(),
        {type: redux.UNPLOT_DETAILS_VILLAGES})
    })

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
  })

  describe('reducer', () => {
    const reducer = redux.microplanningReducer

    it('should return the default state', () => {
      assert.deepEqual(reducer(), {})
    })

    it('should show details', () => {
      assert.deepEqual(
        reducer(undefined, {
          type: redux.SHOW_DETAILS,
          payload: {item: 'details'}
        }),
        { details: 'details', centered: false })

      assert.deepEqual(
        reducer(undefined, {
          type: redux.SHOW_DETAILS,
          payload: {item: 'details', centered: true}
        }),
        { details: 'details', centered: true })
    })

    it('should hide details', () => {
      assert.deepEqual(
        reducer(undefined, {
          type: redux.SHOW_DETAILS,
          payload: {centered: true}
        }),
        { details: undefined, centered: false })
    })

    it('should include item in empty selected list', () => {
      assert.deepEqual(
        reducer(undefined, {
          type: redux.SELECT_VILLAGES,
          payload: [{_id: 1}]
        }),
        { selected: [{_id: 1}] })
    })

    it('should include item in selected list at first position', () => {
      assert.deepEqual(
        reducer({
          selected: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}]
        }, {
          type: redux.SELECT_VILLAGES,
          payload: [{_id: 9}]
        }),
        { selected: [{_id: 9}, {_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}] })
    })

    it('should not include item in selected list if it is already there', () => {
      assert.deepEqual(
        reducer({
          selected: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}]
        }, {
          type: redux.SELECT_VILLAGES,
          payload: [{_id: 3}]
        }),
        { selected: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}] })
    })

    it('should include items in empty selected list in reverse order', () => {
      assert.deepEqual(
        reducer(undefined, {
          type: redux.SELECT_VILLAGES,
          payload: [{_id: 1}, {_id: 2}, {_id: 2}, {_id: 4}]
        }),
        { selected: [{_id: 4}, {_id: 2}, {_id: 1}] })
    })

    it('should include non repeated items in selected list in reverse order', () => {
      assert.deepEqual(
        reducer({
          selected: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}]
        }, {
          type: redux.SELECT_VILLAGES,
          payload: [{_id: 5}, {_id: 2}, {_id: 8}, {_id: 5}]
        }),
        { selected: [{_id: 8}, {_id: 5}, {_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}] })
    })

    it('should remove item from selected list', () => {
      assert.deepEqual(
        reducer({
          selected: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}]
        }, {
          type: redux.UNSELECT_VILLAGES,
          payload: [{_id: 1}]
        }),
        { selected: [{_id: 2}, {_id: 3}, {_id: 4}] })

      assert.deepEqual(
        reducer({
          selected: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}]
        }, {
          type: redux.UNSELECT_VILLAGES,
          payload: [{_id: 3}]
        }),
        { selected: [{_id: 1}, {_id: 2}, {_id: 4}] })

      assert.deepEqual(
        reducer({
          selected: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}]
        }, {
          type: redux.UNSELECT_VILLAGES,
          payload: [{_id: 9}]
        }),
        { selected: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}] })
    })

    it('should remove items from selected list', () => {
      assert.deepEqual(
        reducer({
          selected: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}]
        }, {
          type: redux.UNSELECT_VILLAGES,
          payload: [{_id: 1}, {_id: 2}, {_id: 2}, {_id: 6}, {_id: 8}]
        }),
        { selected: [{_id: 3}, {_id: 4}] })
    })

    it('should delete all selected items', () => {
      assert.deepEqual(
        reducer(undefined, {type: redux.UNSELECT_VILLAGES}),
        { selected: [] })

      assert.deepEqual(
        reducer({selected: [1, 2, 3]}, {type: redux.UNSELECT_VILLAGES}),
        { selected: [] })
    })
  })
})
