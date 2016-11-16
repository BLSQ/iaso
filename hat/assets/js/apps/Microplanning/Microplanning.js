import React, { Component } from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'
import {
  FormattedMessage,
  injectIntl,
  defineMessages
} from 'react-intl'
import chroma from 'chroma-js'
import { createUrl } from '../../utils/fetchData'

import {actions} from './redux'
import geoData from './utils/geoData'
import {Map, MapLegend, MapTooltip, DataSelected} from './components'

const MESSAGES = defineMessages({
  // dateperiod messages
  'since-last-year': {
    id: 'microplanning.dateperiod.since-last-year',
    defaultMessage: 'Since last year'
  },
  'since-three-years': {
    id: 'microplanning.dateperiod.since-three-years',
    defaultMessage: 'Since three years'
  },
  'since-five-years': {
    id: 'microplanning.dateperiod.since-five-years',
    defaultMessage: 'Since five years'
  }
})

const DATEPERIODS = [
  'since-last-year',
  'since-three-years',
  'since-five-years'
]

const areasScale = chroma.scale([ '#BB8FCE', '#5B2C6F' ])
const AREA_LIMIT = 15

// find all the entries in the list that match exact
// with the item values in the indicated keys list
//
// keys: [ 'a', 'b', 'c' ]
// item: { a: 'aàa', b: 'bBb', c: 'cçC', d: 'xxx' }
// one matched value could be: { a: 'AaA', b: 'bbb', c: 'ÇÇÇ', f: 'zzz' }
const findInData = (list, item, keys) => {
  // taken from sense-hat-mobile
  const stripAccents = (word) => {
    return word.toUpperCase()
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
    this.dateHandler = this.dateHandler.bind(this)
  }

  dateHandler (event) {
    const dateperiod = event.target.value
    const url = createUrl({...this.props.params, dateperiod})
    this.props.dispatch(push(url))
  }

  render () {
    const { formatMessage } = this.props.intl
    const { dateperiod } = this.props.params
    const { data, error } = this.props.highlight
    const loading = this.props.highlight.loading
    const { plotted, selected, detailed } = this.props.microplanning
    // buffer radius (m) around a highlighted point
    const buffer = this.props.microplanning.buffer || 0
    const bufferCheck = (buffer > 0)
    const filter = this.props.microplanning.filter || { official: true, other: true }

    const showDetails = (item) => {
      this.props.dispatch(actions.showDetails(item))
    }
    const hideDetails = () => {
      this.props.dispatch(actions.showDetails())
    }
    const showArea = () => {
      this.props.dispatch(actions.showAreaVillages(detailed.zone, detailed.area))
    }
    const selectVillage = () => {
      this.props.dispatch(actions.selectVillage(detailed))
    }
    const selectVillages = (list) => {
      this.props.dispatch(actions.selectVillages(list))
    }
    const unselectVillage = (id) => {
      this.props.dispatch(actions.unselectVillage(id))
    }
    const unselectVillages = (list) => {
      this.props.dispatch(actions.unselectVillages(list))
    }
    const resetSelection = () => {
      this.props.dispatch(actions.resetSelection())
    }
    const filterChange = (event) => {
      filter[event.target.name] = event.target.checked
      this.props.dispatch(actions.filterVillages(filter))
    }
    const bufferChange = (event) => {
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

    // used to check which kind of button display: "select" or "unselect" village
    const isDetailedSelected = detailed && detailed.isVillage && selected &&
      selected.filter((entry) => entry._id === detailed._id).length > 0

    // used to detect if the "show villages" button should be included
    const isDetailedIncluded = detailed && !detailed.isVillage && plotted &&
      plotted.filter((entry) => entry.zone === detailed.zone && entry.area === detailed.area).length > 0

    const highlight = (data && data.confirmedByLocation || [])
      // transform the objects from backend into the frontend format
      .map((item) => ({
        zone: item.ZS,
        area: item.AZ,
        village: item.village,
        cases: item.confirmed_cases,
        date: item.last_confirmed_date
      }))
      // remove not matched/reconciled villages (not in list)
      .filter((item) => findInData(geoData.villages, item, ['zone', 'area', 'village']).length > 0)

    // filter the higlighted areas
    const areas = geoData.areas.features
      .filter((item) => {
        return findInData(highlight, item.properties, ['zone', 'area']).length > 0
      })
      .map((item) => {
        const matched = findInData(highlight, item.properties, ['zone', 'area'])

        // find out the number of cases and the onset date of the last case
        const cases = matched.reduce((prev, curr) => (prev + curr.cases), 0)
        const date = matched.reduce((prev, curr) => (prev >= curr.date ? prev : curr.date), '')
        const color = areasScale(Math.min(cases / AREA_LIMIT, 1.0))

        return {
          ...item,
          properties: {
            ...item.properties,
            cases,
            date,
            color
          }
        }
      })

    // mark the highlighted/selected villages in the list
    const points = (plotted || [])
      .filter((item) =>
        (filter.official && item.type === 'official') ||
        (filter.other && item.type === 'other') ||
        (filter.unknown && item.type === 'unknown')
      )
      .map((item) => {
        const matched = findInData(highlight, item, ['zone', 'area', 'village'])

        return {
          ...item,
          cases: matched.reduce((prev, curr) => (prev + curr.cases), 0),
          date: matched.reduce((prev, curr) => (prev >= curr.date ? prev : curr.date), ''),
          selected: (selected || []).filter((entry) => entry._id === item._id).length > 0
        }
      })

    return (
      <div>
        <div className='filter__container'>
          <h2 className='filter__label'>Select:</h2>
          <div className='filter__container__select'>
            <label htmlFor='date' className='filter__container__select__label'>
              <i className='fa fa-calendar' />
              <FormattedMessage id='microplanning.filter.timeframe' defaultMessage='Timeframe' />
            </label>
            <select disabled={loading} name='date' value={dateperiod} onChange={this.dateHandler} className='select--minimised'>
              {DATEPERIODS.map((period) => (
                <option key={period} value={period}>
                  {formatMessage(MESSAGES[period])}
                </option>
              ))}
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
          <div className='widget__content'>
            <div className='widget__header'>
              <form className='inline'>
                <label htmlFor='official' className='underscore-official'>
                  <input type='checkbox' name='official' checked={filter.official} onChange={filterChange} />
                  <FormattedMessage id='microplanning.display.official' defaultMessage='Official villages' />
                </label>
                <label htmlFor='other' className='underscore-other'>
                  <input type='checkbox' name='other' checked={filter.other} onChange={filterChange} />
                  <FormattedMessage id='microplanning.display.other' defaultMessage='Non official villages' />
                </label>
                <label htmlFor='unknown' className='underscore-unknown'>
                  <input type='checkbox' name='unknown' checked={filter.unknown} onChange={filterChange} />
                  <FormattedMessage id='microplanning.display.unknown' defaultMessage='Unknown villages' />
                </label>

                <label htmlFor='buffer-check' className='underscore-buffer'>
                  <input type='checkbox' name='buffer-check' checked={bufferCheck} onChange={bufferChange} />
                  <FormattedMessage id='microplanning.buffer' defaultMessage='Buffer zone on confirmed cases' />
                  <input type='number' className='small' name='buffer-value' value={buffer} onChange={bufferChange} />
                  {'m'}
                </label>
              </form>
            </div>

            <div className='map__panel_left'>
              { /* map */ }
              <Map
                areas={areas}
                points={points}
                detailed={detailed}
                buffer={buffer}
                select={selectVillages}
                unselect={unselectVillages}
                showDetails={showDetails}
              />
              { /* the legend */ }
              <MapLegend
                scale={areasScale}
                min={1}
                max={AREA_LIMIT}
              />
            </div>

            <div className='map__panel_right'>
              { /* the details view */ }
              { detailed &&
                <div className='details'>
                  <span className='close' onClick={hideDetails}>
                    <i className='fa fa-close' />
                  </span>

                  <MapTooltip item={detailed} />

                  { /* AREA: plot its villages in map */ }
                  { !detailed.isVillage && !isDetailedIncluded &&
                    <button className='button' onClick={showArea}>
                      <FormattedMessage id='microplanning.tooltip.villages.toggle' defaultMessage='Show villages in map' />
                    </button>
                  }

                  { /* VILLAGE: select/unselect */ }
                  { detailed.isVillage && !isDetailedSelected &&
                    <button className='button' onClick={selectVillage}>
                      <FormattedMessage id='microplanning.tooltip.village.select' defaultMessage='Select village' />
                    </button>
                  }
                  { detailed.isVillage && isDetailedSelected &&
                    <button className='button' onClick={() => unselectVillage(detailed._id)}>
                      <FormattedMessage id='microplanning.tooltip.village.unselect' defaultMessage='Unselect village' />
                    </button>
                  }
                </div>
              }

              { /* the selection panel */ }
              <DataSelected
                data={selected}
                show={showDetails}
                remove={unselectVillage}
                reset={resetSelection}
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
