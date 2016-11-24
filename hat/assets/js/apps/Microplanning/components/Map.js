import React, {Component, PropTypes} from 'react'
import ReactDOM from 'react-dom'
import {
  FormattedMessage,
  IntlProvider,
  injectIntl,
  intlShape
} from 'react-intl'
import L from 'leaflet'
import geoData from '../utils/geoData'
import {MapLegend, MapTooltip, MapSelectionList} from './index'

// map base layers (the `key` is the label used in the layers control)
const baseLayers = {
  'Blank': L.tileLayer(''),
  'Open Street Map': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
  'ArcGIS Street Map': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}.jpg'),
  'ArcGIS Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.jpg'),
  'ArcGIS Topo Map': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}.jpg')
}
// this is the default base layer, it should match one of the base layers keys
const DEFAULT_LAYER = 'ArcGIS Topo Map'

// circle size in metres depending on the village type
const RADIUS = {
  official: 350,
  other: 100,
  unknown: 100,
  highlight: 80, // amount to increase if there are cases
  buffer: 5000 // default buffer value (5km)
}

// find all the entries in the list that match exact
// with the item values in the indicated keys list
//
// keys: [ 'a', 'b', 'c' ]
// item: { a: 'aàa', b: 'bBb', c: 'cçC', d: 'xxx' }
// one matched value could be: { a: 'AaA', b: 'bbb', c: 'ÇÇÇ', f: 'zzz' }
const findInData = (list, item, keys) => {
  // taken from sense-hat-mobile
  const stripAccents = (word) => {
    return (word || '').toUpperCase()
      .replace(/[ÀÁÂÄ]/, 'A')
      .replace(/[ÈÉÊ]/, 'E')
      .replace('Ç', 'C')
      .replace('Û', 'U')
      .replace(/[^A-Z0-9]/g, '')
  }

  return list.filter((entry) => (
    keys.every((key) => stripAccents(entry[key]) === stripAccents(item[key]))
  ))
}

class Map extends Component {
  constructor (props) {
    super(props)

    this.state = {
      // leaflet map object
      map: null,
      // where to plot the selected, highlighted and buffer markers
      featureGroup: new L.FeatureGroup(),
      // where to plot ALL villages; different groups based on type
      markersGroup: {
        official: new L.FeatureGroup(),
        other: new L.FeatureGroup(),
        unknown: new L.FeatureGroup()
      },
      // selection mode is active or not
      inSelectionMode: false,
      selectedItems: [],
      bufferSize: RADIUS.buffer,
      filter: { official: true, other: false, unknown: false }
    }

    this.filterChangeHandler = this.filterChangeHandler.bind(this)
    this.bufferChangeHandler = this.bufferChangeHandler.bind(this)
  }

  componentDidMount () {
    this.state.map = this.createMap()
    this.includeControlsInMap(this.state.map)
    this.includeDefaultLayersInMap(this.state.map)
  }
  componentDidUpdate () {
    this.state.map.whenReady(() => {
      this.updateMap()
    })
  }
  componentWillUnmount () {
    if (this.state.map) {
      this.state.map.remove()
    }
  }
  render () {
    const { selectedItems, filter, bufferSize } = this.state
    const bufferCheck = (bufferSize > 0)
    const showSelection = this.state.inSelectionMode || selectedItems.length > 0
    const mapClass = (!showSelection ? 'map__panel' : 'map__panel--left')

    let selectionList = ''
    if (showSelection) {
      selectionList = (
        <div className='map__panel--right'>
          <MapSelectionList
            data={selectedItems}
            show={(item) => this.openPopup(item, item._latlon)}
            deselect={this.deselectVillages} />
        </div>
      )
    }

    return (
      <div className='widget__container'>
        <div className='widget__header'>
          <form className='widget__toggle-group'>
            <span className='widget__toggle-group__legend'>
              <FormattedMessage id='microplanning.display.villages.types' defaultMessage='Village types' />
            </span>
            <label htmlFor='official' className='widget__filterpluslabel__item--official'>
              <input type='checkbox' name='official' checked={filter.official} onChange={this.filterChangeHandler} className='widget__filterpluslabel__input' />
              <span className='widget__filterpluslabel__text--official'>
                <FormattedMessage id='microplanning.display.official' defaultMessage='Official villages' />
              </span>
            </label>
            <label htmlFor='other' className='widget__filterpluslabel__item--other'>
              <input type='checkbox' name='other' checked={filter.other} onChange={this.filterChangeHandler} className='widget__filterpluslabel__input' />
              <span className='widget__filterpluslabel__text--other'>
                <FormattedMessage id='microplanning.display.other' defaultMessage='Non official villages' />
              </span>
            </label>
            <label htmlFor='unknown' className='widget__filterpluslabel__item--unknown'>
              <input type='checkbox' name='unknown' checked={filter.unknown} onChange={this.filterChangeHandler} className='widget__filterpluslabel__input' />
              <span className='widget__filterpluslabel__text--unknown'>
                <FormattedMessage id='microplanning.display.unknown' defaultMessage='Unknown villages' />
              </span>
            </label>

            <label htmlFor='buffer-check' className='widget__filterpluslabel__item--buffer'>
              <input type='checkbox' name='buffer-check' checked={bufferCheck} onChange={this.bufferChangeHandler} className='widget__filterpluslabel__input' />
              <span className='widget__filterpluslabel__text--buffer'>
                <FormattedMessage id='microplanning.buffer' defaultMessage='Buffer zone on confirmed cases' />
                <input type='number' className='small' disabled={!bufferCheck} name='buffer-value' value={bufferSize} onChange={this.bufferChangeHandler} />
                {'m'}
              </span>
            </label>
          </form>
          <MapLegend />
        </div>

        <div className=''>
          <div className={mapClass}>
            <div ref={(node) => (this.mapContainer = node)} className='map-container' />
          </div>
          {selectionList}
        </div>
      </div>
    )
  }

  createMap () {
    const node = this.mapContainer

    // HACK: Work around for testing Leaflet in JSDOM
    // see: https://github.com/Leaflet/Leaflet/issues/4823
    if (!node.clientWidth && !node.clientHeight) {
      node.clientHeight = 720
      node.clientWidth = 1000
    }

    // create map
    const map = L.map(node, {
      attributionControl: false,
      zoomControl: false,
      center: geoData.center,
      zoom: geoData.zoom
    })

    // add the default base layer
    baseLayers[DEFAULT_LAYER].addTo(map)

    // create panes (to preserve z-index order)
    map.createPane('custom-pane-layers')
    map.createPane('custom-pane-buffer')
    map.createPane('custom-pane-markers')

    // show metric scale
    L.control.scale({ imperial: false }).addTo(map)

    return map
  }

  includeControlsInMap (map) {
    // The order in which the controls are added matters
    //
    // In TOP-LEFT
    // 1.- selection control
    // 2.- zoom control
    // 3.- fit to bounds control
    // 4.- layers control (so far only for base tiles)

    const commonOptions = {position: 'topleft'}

    // control to `activate selection mode`
    const selectionModeControl = L.control(commonOptions)
    selectionModeControl.onAdd = (map) => {
      const div = L.DomUtil.create('div', 'map__control__button--selection')
      this.renderSelectionModeControl(div, false)

      L.DomEvent.on(div, 'click', (event) => {
        L.DomEvent.stop(event)
        this.renderSelectionModeControl(div, !this.state.inSelectionMode)
        this.setState({ inSelectionMode: !this.state.inSelectionMode })
      })

      return div
    }
    selectionModeControl.addTo(map)

    // zoom control (standard)
    L.control.zoom(commonOptions).addTo(map)

    // control to `fitToBounds`
    const fitToBoundsControl = L.control(commonOptions)
    fitToBoundsControl.onAdd = (map) => {
      const div = L.DomUtil.create('div', 'map__control__button')
      div.innerHTML = '<i class="fa fa-map-marker"></i>'
      L.DomEvent.on(div, 'click', (event) => {
        L.DomEvent.stop(event)
        this.fitToBounds()
      })

      return div
    }
    fitToBoundsControl.addTo(map)

    // layer control (standard)
    L.control.layers(baseLayers, null, commonOptions).addTo(map)

    return map
  }

  includeDefaultLayersInMap (map) {
    // include dynamic layer (highlight, selected, buffer...)
    map.addLayer(this.state.featureGroup)

    const shapeOptions = {
      pane: 'custom-pane-layers',
      style: () => ({className: 'map-layer transparent'}),
      onEachFeature: (feature, layer) => {
        this.addLayerEvents(layer, feature.properties)
      }
    }

    // plot the ALL zones boundaries
    map.addLayer(L.geoJson(geoData.zones, shapeOptions))

    // use for the areas
    const areasGroup = new L.FeatureGroup()
    areasGroup.addLayer(L.geoJson(geoData.areas, shapeOptions))

    L.DomEvent.on(map, 'zoomend', (event) => {
      // plot the AREAS if the zoom is greater than 9
      if (map.getZoom() > 9) {
        if (!map.hasLayer(areasGroup)) {
          map.addLayer(areasGroup)
        }
      } else {
        if (map.hasLayer(areasGroup)) {
          map.removeLayer(areasGroup)
        }
      }
    })

    return map
  }

  updateMap () {
    const {
      featureGroup,
      selectedItems,
      filter,
      bufferSize
    } = this.state

    const highlightedItems = (this.props.highlightedItems || [])
      // remove not matched/reconciled villages (not in list)
      .filter((item) => findInData(geoData.villages, item, ['zone', 'area', 'village']).length > 0)
      .map((item) => {
        const matched = findInData(geoData.villages, item, ['zone', 'area', 'village'])[0]
        return { ...item, ...matched }
      })
      .filter((item) => filter[item.type])

    // TODO: filter the higlighted areas
    // const findInShape = (item) => (findInData(highlight, item.properties, item.properties._keys))
    // const shapes = [].concat(
    //   geoData.zones.features
    //     .filter((item) => (findInShape(item).length > 0)),
    //   geoData.areas.features
    //     .filter((item) => (findInShape(item).length > 0))
    // )
    //   .map((item) => {
    //     const matched = findInShape(item)

    //     // find out the number of cases and the onset date of the last case
    //     const confirmedCases = matched.reduce((prev, curr) => (prev + curr.confirmedCases), 0)
    //     const screenedPeople = matched.reduce((prev, curr) => (prev + curr.screenedPeople), 0)
    //     const lastConfirmedCaseDate = matched.reduce((prev, curr) => (prev >= curr.lastConfirmedCaseDate ? prev : curr.lastConfirmedCaseDate), '')
    //     const lastScreeningDate = matched.reduce((prev, curr) => (prev >= curr.lastScreeningDate ? prev : curr.lastScreeningDate), '')

    //     return {
    //       ...item,
    //       properties: {
    //         ...item.properties,
    //         confirmedCases,
    //         lastConfirmedCaseDate,
    //         screenedPeople,
    //         lastScreeningDate
    //       }
    //     }
    //   })

    // reset previous state
    featureGroup.clearLayers()

    // plot indicated villages
    Object.keys(filter).forEach((key) => {
      this.plotVillagesByType(key, filter[key])
    })
    const plotted = geoData.villages.filter((item) => (filter[item.type]))

    highlightedItems.forEach((item) => {
      const radius = RADIUS[item.type] + RADIUS.highlight
      const options = {
        pane: 'custom-pane-markers',
        radius: radius,
        className: 'map-marker highlight'
      }

      const marker = L.circle(item._latlon, options)
      this.addLayerEvents(marker, item)
      featureGroup.addLayer(marker)

      if (bufferSize > 0 && item.confirmedCases > 0) {
        // find out the points within the buffer zone
        // TO BE IMPROVED (quadratic)
        const inBuffer = plotted.filter((entry) => (
            item._id !== entry._id &&
            item._latlon.distanceTo(entry._latlon) <= (bufferSize + radius)
          ))
        inBuffer.push(item) // this has the info about cases
        const inSelection = selectedItems.filter((entry) => entry._id === item._id).length > 0

        // create buffer zone around the highlighted village
        const bufferZone = L.circle(item._latlon, {
          pane: 'custom-pane-buffer',
          radius: bufferSize,
          className: 'map-marker buffer'
        })
        featureGroup.addLayer(bufferZone)

        bufferZone.on({
          click: (event) => {
            L.DomEvent.stop(event)

            if (this.state.inSelectionMode) {
              if (inSelection) {
                this.deselectVillages(inBuffer)
              } else {
                this.selectVillages(inBuffer)
              }
            }
          }
        })
      }
    })

    selectedItems.forEach((item) => {
      // take size from village type and increase it if there are cases
      const radius = RADIUS[item.type] + ((item.confirmedCases > 0) ? RADIUS.highlight : 0)
      const options = {
        pane: 'custom-pane-markers',
        radius: radius,
        className: 'map-marker selected'
      }

      const marker = L.circle(item._latlon, options)
      this.addLayerEvents(marker, {...item, selected: true})
      featureGroup.addLayer(marker)
    })
  }

  fitToBounds () {
    const {map, featureGroup} = this.state
    setTimeout(() => {
      if (featureGroup.getLayers().length) {
        map.fitBounds(featureGroup.getBounds(), { maxZoom: 13 })
      } else {
        map.setView(geoData.center, geoData.zoom)
      }
      map.invalidateSize()
    }, 1)
  }

  plotVillagesByType (type, active) {
    const {map, markersGroup} = this.state

    const layer = markersGroup[type]
    if (active) {
      // include layer
      if (!map.hasLayer(layer)) {
        map.addLayer(layer)

        // check if the layer has markers
        if (layer.getLayers().length === 0) {
          geoData.villages
            .filter((item) => item.type === type)
            .forEach((item, index) => {
              const options = {
                pane: 'custom-pane-markers',
                radius: RADIUS[type],
                className: 'map-marker ' + type
              }

              const marker = L.circle(item._latlon, options)
              this.addLayerEvents(marker, item)
              layer.addLayer(marker)
            })
        }
      }
    } else {
      // remove layer
      if (map.hasLayer(layer)) {
        map.removeLayer(layer)
      }
    }
  }

  addLayerEvents (layer, item) {
    layer.on({
      click: (event) => {
        L.DomEvent.stop(event)

        if (this.state.inSelectionMode) {
          if (item.isVillage) {
            (item.selected ? this.deselectVillages([item]) : this.selectVillages([item]))
          }
        } else {
          this.openPopup(item, event.latlng)
        }
      },
      contextmenu: (event) => {
        L.DomEvent.stop(event)
        this.openPopup(item, event.latlng)
      }
    })
    // layer.bindTooltip(item._label, { sticky: true })
  }

  openPopup (item, latlng) {
    const div = L.DomUtil.create('div', 'tooltip')
    ReactDOM.render(this.injectI18n(<MapTooltip item={item} />), div)

    this.state.map.openPopup(div, latlng, { minWidth: 200, maxWidth: 500 })
  }

  renderSelectionModeControl (container, active) {
    const className = 'map__icon--select' + (active ? '--active' : '')
    const component = (
      <div>
        <i className={className} />
        <span className='map__text--select'>
          <FormattedMessage id='microplanning.selection.active' defaultMessage='Select villages' />
        </span>
      </div>
    )

    ReactDOM.render(this.injectI18n(component), container)
  }

  injectI18n (component) {
    // we need to wrap it with IntlProvider to use i18n features
    const {locale, messages} = this.props.intl

    return (
      <IntlProvider locale={locale} messages={messages}>
        {component}
      </IntlProvider>
    )
  }

  selectVillages (selection) {
    let items = this.state.selectedItems || []
    const _find = (list, item) => (list.find((entry) => entry._id === item._id))
    selection.forEach((item) => {
      if (!_find(items, item)) {
        items = [item, ...items]
      }
    })
    this.setState({ selectedItems: items })
  }

  deselectVillages (selection) {
    if (!selection || selection.length === 0) {
      this.setState({ selectedItems: [] })
      return
    }

    let items = this.state.selectedItems || []
    const ids = selection.map((item) => item._id)
    const condition = (entry) => (ids.indexOf(entry._id) === -1)
    this.setState({ selectedItems: items.filter(condition) })
  }

  filterChangeHandler (event) {
    const {filter} = this.state
    filter[event.target.name] = event.target.checked
    this.setState({ filter: filter })
  }

  bufferChangeHandler (event) {
    let value
    if (event.target.name === 'buffer-check') {
      if (!event.target.checked) {
        value = 0
      } else {
        value = RADIUS.buffer // default value
      }
    } else {
      value = parseInt(event.target.value, 10)
    }
    this.setState({ bufferSize: value })
  }
}

Map.propTypes = {
  highlightedItems: PropTypes.arrayOf(PropTypes.object),
  intl: intlShape.isRequired
}

export default injectIntl(Map)
