/* global describe, it */
import assert from 'assert'
import * as map from './map'

describe('Microplanning map redux', () => {
  describe('actions', () => {
    it('should create the change layer action', () => {
      assert.deepEqual(
        map.changeLayer(map.mapLayerTypes.legend, 'layer'),
        {type: map.LEGEND_TOGGLE, payload: 'layer'})

      assert.deepEqual(
        map.changeLayer(map.mapLayerTypes.baseLayer, 'layer'),
        {type: map.BASE_LAYER_CHANGE, payload: 'layer'})

      assert.deepEqual(
        map.changeLayer(map.mapLayerTypes.overlay, 'layer'),
        {type: map.OVERLAY_TOGGLE, payload: 'layer'})
    })

    it('should create the change base layer action', () => {
      assert.deepEqual(
        map.changeBaseLayer('base layer'),
        {type: map.BASE_LAYER_CHANGE, payload: 'base layer'})
    })

    it('should create the toggle overlay action', () => {
      assert.deepEqual(
        map.toggleOverlay('overlay'),
        {type: map.OVERLAY_TOGGLE, payload: 'overlay'})
    })

    it('should create the toggle legend action', () => {
      assert.deepEqual(
        map.toggleLegend('legend'),
        {type: map.LEGEND_TOGGLE, payload: 'legend'})
    })

    it('should create the activate fullscreen action', () => {
      assert.deepEqual(map.activateFullscreen(), {type: map.FULLSCREEN_ACTIVATE})
    })

    it('should create the deactivate fullscreen action', () => {
      assert.deepEqual(map.deactivateFullscreen(), {type: map.FULLSCREEN_DEACTIVATE})
    })
  })

  describe('reducer', () => {
    const reducer = map.mapReducer
    const initialState = map.mapInitialState

    it('should return the default state', () => {
      assert.deepEqual(reducer(), initialState)
    })

    it('should do nothing on changing layer action if layer type is UNKNOWN', () => {
      assert.deepEqual(
        reducer(undefined, {
          type: map.UNKNOWN,
          payload: 'layer'
        }),
        initialState)
    })

    it('should do nothing on toggle legend action if legend does not exist', () => {
      assert.deepEqual(
        reducer(undefined, {
          type: map.LEGEND_TOGGLE,
          payload: 'legend'
        }),
        initialState)
    })

    it('should toggle legend status', () => {
      assert.deepEqual(
        reducer(undefined, {
          type: map.LEGEND_TOGGLE,
          payload: 'official'
        }),
        {...initialState, legend: {...initialState.legend, official: false}})
    })

    it('should do nothing on toggle overlay action if overlay does not exist', () => {
      assert.deepEqual(
        reducer(undefined, {
          type: map.OVERLAY_TOGGLE,
          payload: 'overlay'
        }),
        initialState)
    })

    it('should toggle overlay status', () => {
      assert.deepEqual(
        reducer(undefined, {
          type: map.OVERLAY_TOGGLE,
          payload: 'labels'
        }),
        {...initialState, overlays: {...initialState.overlays, labels: true}})
    })

    it('should do nothing on changing base layer action if base layer does not exist', () => {
      assert.deepEqual(
        reducer(undefined, {
          type: map.BASE_LAYER_CHANGE,
          payload: 'base layer'
        }),
        initialState)
    })

    it('should change base layer', () => {
      assert.deepEqual(
        reducer(undefined, {
          type: map.BASE_LAYER_CHANGE,
          payload: 'osm'
        }),
        {...initialState, baseLayer: 'osm'})
    })

    it('should activate/deactivate fullscreen mode', () => {
      assert.deepEqual(
        reducer(undefined, {type: map.FULLSCREEN_ACTIVATE}),
        {...initialState, fullscreen: true})
      assert.deepEqual(
        reducer(undefined, {type: map.FULLSCREEN_DEACTIVATE}),
        {...initialState, fullscreen: false})
    })
  })
})
