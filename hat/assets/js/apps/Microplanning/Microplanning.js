import React, { Component } from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'
import {
  FormattedMessage,
  injectIntl,
  defineMessages
} from 'react-intl'
import { createUrl } from '../../utils/fetchData'

import {actions} from './redux'
import geoData from './utils/geoData'
import {Map, MapLegend} from './components'

const MESSAGES = defineMessages({
  // dateperiod messages
  'since-last-year': {
    id: 'microplanning.dateperiod.since-last-year',
    defaultMessage: 'One year'
  },
  'since-three-years': {
    id: 'microplanning.dateperiod.since-three-years',
    defaultMessage: 'Three years'
  },
  'since-five-years': {
    id: 'microplanning.dateperiod.since-five-years',
    defaultMessage: 'Five years'
  },

  // location messages
  'location-national': {
    defaultMessage: '--- ALL ---',
    id: 'microplanning.location.national'
  }
})

const DATEPERIODS = [
  'since-last-year',
  'since-three-years',
  'since-five-years'
]

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

export class Microplanning extends Component {
  constructor () {
    super()
    this.caseDateHandler = this.caseDateHandler.bind(this)
    this.screeningDateHandler = this.screeningDateHandler.bind(this)
    this.locationHandler = this.locationHandler.bind(this)
    this.selectVillages = this.selectVillages.bind(this)
    this.unselectVillages = this.unselectVillages.bind(this)
    this.filterChange = this.filterChange.bind(this)
    this.bufferChange = this.bufferChange.bind(this)
  }

  caseDateHandler (event) {
    const caseperiod = event.target.value
    const url = createUrl({...this.props.params, caseperiod})
    this.props.dispatch(push(url))
  }

  screeningDateHandler (event) {
    const screeningperiod = event.target.value
    const url = createUrl({...this.props.params, screeningperiod})
    this.props.dispatch(push(url))
  }

  locationHandler (event) {
    const location = event.target.value
    const url = createUrl({...this.props.params, location})
    this.props.dispatch(push(url))
  }

  selectVillages (list) {
    if (list) {
      this.props.dispatch(actions.selectVillages(list))
    }
  }

  unselectVillages (list) {
    if (list) {
      this.props.dispatch(actions.unselectVillages(list))
    }
  }

  filterChange (event) {
    const {filter} = this.props.microplanning
    filter[event.target.name] = event.target.checked
    this.props.dispatch(actions.filterVillages(filter))
  }

  bufferChange (event) {
    let value
    if (event.target.name === 'buffer-check') {
      if (!event.target.checked) {
        value = 0
      } else {
        value = 5000 // default value
      }
    } else {
      value = parseInt(event.target.value, 10)
    }
    this.props.dispatch(actions.setBuffer(value))
  }

  render () {
    const { formatMessage } = this.props.intl
    // TODO: const { caseperiod, screeningperiod, location } = this.props.params
    const { caseperiod, location } = this.props.params
    const { data, error } = this.props.highlight
    const loading = this.props.highlight.loading
    const locations = data && data.locations || []
    const {
      selected,
      buffer, // buffer radius (m) around a highlighted point
      filter
    } = this.props.microplanning
    const bufferCheck = (buffer > 0)

    const highlight = (data && data.confirmedByLocation || [])
      // transform the objects from backend into the frontend format
      .map((item) => ({
        zone: item.ZS,
        area: item.AZ,
        village: item.village,
        cases: item.confirmed_cases,
        caseDate: item.last_confirmed_date,
        visitDate: item.last_screening_date
      }))
      // remove not matched/reconciled villages (not in list)
      .filter((item) => findInData(geoData.villages, item, ['zone', 'area', 'village']).length > 0)
      .map((item) => {
        const matched = findInData(geoData.villages, item, ['zone', 'area', 'village'])[0]
        return { ...item, ...matched }
      })
      .filter((item) => filter[item.type])

    // filter the higlighted areas
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
    //     const cases = matched.reduce((prev, curr) => (prev + curr.cases), 0)
    //     const caseDate = matched.reduce((prev, curr) => (prev >= curr.caseDate ? prev : curr.caseDate), '')
    //     const visitDate = matched.reduce((prev, curr) => (prev >= curr.visitDate ? prev : curr.visitDate), '')

    //     return {
    //       ...item,
    //       properties: {
    //         ...item.properties,
    //         cases,
    //         caseDate,
    //         visitDate
    //       }
    //     }
    //   })

    return (
      <div ref={(node) => (this.container = node)}>
        <div className='filter__container'>
          <h2 className='filter__label'>
            <FormattedMessage id='microplanning.filter.highlight' defaultMessage='Highlight villages' />
          </h2>
          <div key='filter-case-date' className='filter__container__select'>
            <label htmlFor='casedate' className='filter__container__select__label'>
              <FormattedMessage id='microplanning.filter.cases.date' defaultMessage='with HAT cases in past' />
            </label>
            <select disabled={loading} name='casedate' value={caseperiod} onChange={this.caseDateHandler} className='select--minimised'>
              {DATEPERIODS.map((period) => (
                <option key={period} value={period}>
                  {formatMessage(MESSAGES[period])}
                </option>
              ))}
            </select>
          </div>
          { /* TODO: first change django filters
          <div key='filter-screening-date' className='filter__container__select'>
            <label htmlFor='screeningperiod' className='filter__container__select__label'>
              <FormattedMessage id='microplanning.filter.screening.date' defaultMessage='and not visited in past' />
            </label>
            <select disabled={loading} name='screeningperiod' value={screeningperiod} onChange={this.screeningDateHandler} className='select--minimised'>
              {DATEPERIODS.map((period) => (
                <option key={period} value={period}>
                  {formatMessage(MESSAGES[period])}
                </option>
              ))}
            </select>
          </div>
          */ }
          <div key='filter-location' className='filter__container__select'>
            <label htmlFor='location' className='filter__container__select__label'>
              <FormattedMessage id='microplanning.filter.location' defaultMessage='in the Zone de Sante' />
            </label>
            <select disabled={loading} name='location' value={location || ''} onChange={this.locationHandler} className='select--minimised'>
              <option key='all' value=''>
                {formatMessage(MESSAGES['location-national'])}
              </option>
              {locations.map((loc) => {
                var val = loc.ZS
                return <option key={val} value={val}>{val}</option>
              })}
            </select>
          </div>
        </div>
        <div>
          {
            error && <div className='widget__container'>
              <div className='widget__header'>
                <h2 className='widget__heading text--error'>Error:</h2>
              </div>
              <div className='widget__content'>
                {error}
              </div>
            </div>
          }
        </div>
        <div className='widget__container'>
          <div className='widget__header'>
            <form className='widget__toggle-group'>
              <span className='widget__toggle-group__legend'>
                <FormattedMessage id='microplanning.display.villages.types' defaultMessage='Village types' />
              </span>
              <label htmlFor='official' className='widget__filterpluslabel__item--official'>
                <input type='checkbox' name='official' checked={filter.official} onChange={this.filterChange} className='widget__filterpluslabel__input' />
                <span className='widget__filterpluslabel__text--official'>
                  <FormattedMessage id='microplanning.display.official' defaultMessage='Official villages' />
                </span>
              </label>
              <label htmlFor='other' className='widget__filterpluslabel__item--other'>
                <input type='checkbox' name='other' checked={filter.other} onChange={this.filterChange} className='widget__filterpluslabel__input' />
                <span className='widget__filterpluslabel__text--other'>
                  <FormattedMessage id='microplanning.display.other' defaultMessage='Non official villages' />
                </span>
              </label>
              <label htmlFor='unknown' className='widget__filterpluslabel__item--unknown'>
                <input type='checkbox' name='unknown' checked={filter.unknown} onChange={this.filterChange} className='widget__filterpluslabel__input' />
                <span className='widget__filterpluslabel__text--unknown'>
                  <FormattedMessage id='microplanning.display.unknown' defaultMessage='Unknown villages' />
                </span>
              </label>

              <label htmlFor='buffer-check' className='widget__filterpluslabel__item--buffer'>
                <input type='checkbox' name='buffer-check' checked={bufferCheck} onChange={this.bufferChange} className='widget__filterpluslabel__input' />
                <span className='widget__filterpluslabel__text--buffer'>
                  <FormattedMessage id='microplanning.buffer' defaultMessage='Buffer zone on confirmed cases' />
                  <input type='number' className='small' disabled={!bufferCheck} name='buffer-value' value={buffer} onChange={this.bufferChange} />
                  {'m'}
                </span>
              </label>
              <MapLegend />
            </form>
          </div>

          <div className=''>
            <div className='map__panel'>
              <Map
                highlight={highlight}
                selected={selected}
                buffer={buffer}
                filter={filter}
                select={this.selectVillages}
                unselect={this.unselectVillages}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }
}

const MicroplanningWithIntl = injectIntl(Microplanning)

export default connect((state, ownProps) => ({
  config: state.config,
  highlight: state.highlight,
  microplanning: state.microplanning
}))(MicroplanningWithIntl)
