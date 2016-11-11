/* global describe, it */
import assert from 'assert'
import * as redux from './redux'

describe('Microplanning actions', () => {
  describe('actions', () => {
    it('should create the show details action', () => {
      assert.deepEqual(
        redux.showDetails('item'),
        {type: redux.SHOW_DETAILS, payload: 'item'})
    })

    it('should create the select village action', () => {
      assert.deepEqual(
        redux.selectVillage('village'),
        {type: redux.SELECT_VILLAGE, payload: 'village'})
    })

    it('should create the unselect village action', () => {
      assert.deepEqual(
        redux.unselectVillage('village'),
        {type: redux.UNSELECT_VILLAGE, payload: 'village'})
    })

    it('should create the reset selection action', () => {
      assert.deepEqual(
        redux.resetSelection(),
        {type: redux.RESET_SELECTION})
    })

    it('should create the show area villages action', () => {
      assert.deepEqual(
        redux.showAreaVillages('zone', 'area'),
        {type: redux.SHOW_AREA, payload: {zone: 'zone', area: 'area'}})
    })

    it('should create the hide area villages action', () => {
      assert.deepEqual(
        redux.hideAreaVillages('zone', 'area'),
        {type: redux.HIDE_AREA, payload: {zone: 'zone', area: 'area'}})
    })
  })

  describe('reducer', () => {
    const reducer = redux.microplanningReducer

    it('should return the default state', () => {
      assert.deepEqual(reducer(), {})
    })

    it('should show details', () => {
      assert.deepEqual(
        reducer(undefined, {type: redux.SHOW_DETAILS, payload: 'details'}),
        { detailed: 'details' })
    })

    it('should include item in empty selected list', () => {
      assert.deepEqual(
        reducer(undefined, {type: redux.SELECT_VILLAGE, payload: {_id: 1}}),
        { selected: [{_id: 1}] })
    })

    it('should include item in selected list at first position', () => {
      assert.deepEqual(
        reducer({
          selected: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}]
        }, {
          type: redux.SELECT_VILLAGE,
          payload: {_id: 9}
        }),
        { selected: [{_id: 9}, {_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}] })
    })

    it('should not include item in selected list if it is already there', () => {
      assert.deepEqual(
        reducer({
          selected: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}]
        }, {
          type: redux.SELECT_VILLAGE,
          payload: {_id: 3}
        }),
        { selected: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}] })
    })

    it('should remove item from selected list', () => {
      assert.deepEqual(
        reducer({
          selected: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}]
        }, {
          type: redux.UNSELECT_VILLAGE,
          payload: 1
        }),
        { selected: [{_id: 2}, {_id: 3}, {_id: 4}] })

      assert.deepEqual(
        reducer({
          selected: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}]
        }, {
          type: redux.UNSELECT_VILLAGE,
          payload: 3
        }),
        { selected: [{_id: 1}, {_id: 2}, {_id: 4}] })

      assert.deepEqual(
        reducer({
          selected: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}]
        }, {
          type: redux.UNSELECT_VILLAGE,
          payload: 9
        }),
        { selected: [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}] })
    })

    it('should delete all selected items', () => {
      assert.deepEqual(
        reducer(undefined, {type: redux.RESET_SELECTION}),
        { selected: [] })

      assert.deepEqual(
        reducer({selected: [1, 2, 3]}, {type: redux.RESET_SELECTION}),
        { selected: [] })
    })
  })
})
