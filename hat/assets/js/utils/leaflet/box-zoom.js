/*
 * L.Control.BoxZoom
 * A visible, clickable control for doing a box zoom.
 * https://github.com/gregallensworth/L.Control.BoxZoom
 */

import L from 'leaflet'

L.Control.BoxZoom = L.Control.extend({
  options: {
    position: 'topright'
  },

  initialize: function (options) {
    L.setOptions(this, options)
    this.map = null
    this.active = false
  },

  onAdd: function (map) {
    // add a linkage to the map, since we'll be managing map layers
    this.map = map
    this.active = false

    // create our button: uses FontAwesome cuz that font is... awesome
    // assign this here control as a property of the visible DIV, so we can be more terse when writing click-handlers on that visible DIV
    this.controlDiv = L.DomUtil.create('div', 'map__control__button hide-on-print')
    this.controlDiv.control = this
    this.controlDiv.title = this.options.title || 'Click here then draw a square on the map, to zoom in to an area'
    this.controlDiv.innerHTML = '<i class="fa fa-square-o"></i>'
    L.DomEvent
      .addListener(this.controlDiv, 'mousedown', L.DomEvent.stopPropagation)
      .addListener(this.controlDiv, 'click', L.DomEvent.stopPropagation)
      .addListener(this.controlDiv, 'click', L.DomEvent.preventDefault)
      .addListener(this.controlDiv, 'click', function () {
        this.control.toggleState()
      })

    // start by toggling our state to off this disables the boxZoom hooks on the map, in favor of this one
    this.setStateOff()

    // done!
    return this.controlDiv
  },

  toggleState: function () {
    this.active ? this.setStateOff() : this.setStateOn()
  },

  setStateOn: function () {
    L.DomUtil.addClass(this.controlDiv, 'active')
    this.active = true
    this.map.dragging.disable()
    this.map.boxZoom.addHooks()

    this.map.on('mousedown', this.handleMouseDown, this)
    this.map.on('boxzoomend', this.setStateOff, this)

    L.DomUtil.addClass(this.map._container, 'leaflet-control-boxzoom-active')
  },

  setStateOff: function () {
    L.DomUtil.removeClass(this.controlDiv, 'active')
    this.active = false
    this.map.off('mousedown', this.handleMouseDown, this)
    this.map.dragging.enable()
    this.map.boxZoom.removeHooks()

    L.DomUtil.removeClass(this.map._container, 'leaflet-control-boxzoom-active')
  },

  handleMouseDown: function (event) {
    /* eslint-disable */
    this.map.boxZoom._onMouseDown.call(this.map.boxZoom, {
      clientX: event.originalEvent.clientX,
      clientY: event.originalEvent.clientY,
      which: 1,
      shiftKey: true
    })
    /* eslint-enable */
  }
})

L.Control.boxzoom = function (options) {
  return new L.Control.BoxZoom(options)
}
