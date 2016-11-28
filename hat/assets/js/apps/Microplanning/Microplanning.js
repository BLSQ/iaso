import React, { Component } from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl'
import { createUrl } from '../../utils/fetchData'

import { Map } from './components'
import { selectItems, deselectItems } from './selection'

// REMOVE AFTER WORKSHOP
import geoData from './utils/geoData'
const {data2015, isEqual, areEqual} = geoData

const MESSAGES = defineMessages({
  'location-national': {
    defaultMessage: '--- all ---',
    id: 'microplanning.location.national'
  }
})

export class Microplanning extends Component {
  constructor () {
    super()
    this.caseDateHandler = this.caseDateHandler.bind(this)
    this.screeningDateHandler = this.screeningDateHandler.bind(this)
    this.locationHandler = this.locationHandler.bind(this)
    this.selectItemsHandler = this.selectItemsHandler.bind(this)
    this.deselectItemsHandler = this.deselectItemsHandler.bind(this)
  }

  caseDateHandler (event) {
    const caseyearfrom = parseInt(event.target.value, 10)
    const url = createUrl({...this.props.params, caseyearfrom})
    this.props.dispatch(push(url))
  }

  screeningDateHandler (event) {
    const screeningyearto = parseInt(event.target.value, 10)
    const url = createUrl({...this.props.params, screeningyearto})
    this.props.dispatch(push(url))
  }

  locationHandler (event) {
    const location = event.target.value
    const url = createUrl({...this.props.params, location})
    this.props.dispatch(push(url))
  }

  selectItemsHandler (list) {
    this.props.dispatch(selectItems(list))
  }

  deselectItemsHandler (list) {
    this.props.dispatch(deselectItems(list))
  }

  render () {
    const { formatMessage } = this.props.intl
    const { caseyearfrom, screeningyearto, location } = this.props.params
    const { data, error, loading } = this.props.villages
    const selectedItems = (this.props.selection.selectedItems || [])
    const villagesWithConfirmedCases = (data && data.villagesWithConfirmedCases || [])

    // REMOVE AFTER WORKSHOP
    let highlightedItems = []
    if (!loading && !error) {
      const year = new Date().getFullYear() - parseInt(caseyearfrom || 0, 10)
      if (year > 2015) {
        highlightedItems = villagesWithConfirmedCases
      } else {
        const defaultLastConfirmedCaseDate = '2015-12-31'
        const keys = ['zone', 'area', 'village']
        const extra2015 = data2015
          .filter((item2015) => !location || isEqual(item2015.zone, location))

        // 1.- add to fetched data 2015 entries
        highlightedItems = villagesWithConfirmedCases.map((itemNo2015) => {
          const item2015 = extra2015.find((entry) => areEqual(itemNo2015, entry, keys))
          if (item2015) {
            const confirmedCases = itemNo2015.confirmedCases + item2015.confirmedCases
            const lastConfirmedCaseDate = (itemNo2015.lastConfirmedCaseDate > defaultLastConfirmedCaseDate)
              ? itemNo2015.lastConfirmedCaseDate
              : defaultLastConfirmedCaseDate
            return {...itemNo2015, confirmedCases, lastConfirmedCaseDate}
          }
          return itemNo2015
        })

        // 2.- include data from 2015 that it's not in fetched data
        extra2015
          .forEach((item2015) => {
            const itemNo2015 = villagesWithConfirmedCases.find((entry) => areEqual(item2015, entry, keys))
            if (!itemNo2015) {
              highlightedItems.push({...item2015, lastConfirmedCaseDate: defaultLastConfirmedCaseDate})
            }
          })
      }
    }

    // extract unique zones from fetched data
    // const locations = highlightedItems.map((item) => item.zone)
    //   .filter((value, index, array) => array.indexOf(value) === index)
    //   .map((value) => (<option key={value} value={value}>{value}</option>))
    const locations = [
      'Bokoro',
      'Bulungu',
      'Kikongo',
      'Kimputu',
      'Mosango',
      'Yasa-bonga'
    ].map((value) => (<option key={value} value={value}>{value}</option>))
    // !REMOVE AFTER WORKSHOP

    return (
      <div>
        <div className='filter__container filter__container--reduced'>
          <h4 className='block--margin-bottom--xxs'>
            <FormattedMessage id='microplanning.filter.highlight' defaultMessage='Highlight villages:' />
          </h4>
        </div>
        <div className='filter__container'>
          <div key='filter-case-date' className='filter__container__input'>
            <label htmlFor='caseyearfrom' className='filter__container__select__label'>
              <FormattedMessage id='microplanning.filter.cases.date' defaultMessage='with HAT cases in past' />
            </label>
            <input type='number' disabled={loading} name='caseyearfrom' min='0' value={caseyearfrom || 0} onChange={this.caseDateHandler} className='input--minimised' />
            <label className='filter__container__select__label__after'>
              <FormattedMessage id='microplanning.filter.years' defaultMessage='years' />
            </label>
          </div>

          <div key='filter-screening-date' className='filter__container__input'>
            <label htmlFor='screeningdateto' className='filter__container__select__label'>
              <FormattedMessage id='microplanning.filter.screening.date' defaultMessage='and not visited in past' />
            </label>
            <input type='number' disabled={loading} name='screeningyearto' min='0' value={screeningyearto || 0} onChange={this.screeningDateHandler} className='input--minimised' />
            <label className='filter__container__select__label__after'>
              <FormattedMessage id='microplanning.filter.years' defaultMessage='years' />
            </label>
          </div>

          <div key='filter-location' className='filter__container__select'>
            <label htmlFor='location' className='filter__container__select__label'>
              <FormattedMessage id='microplanning.filter.location' defaultMessage='in the Zone de Sante' />
            </label>
            <select disabled={loading} name='location' value={location || ''} onChange={this.locationHandler} className='select--minimised'>
              <option key='all' value=''>
                {formatMessage(MESSAGES['location-national'])}
              </option>
              {locations}
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

        <Map
          highlightedItems={highlightedItems}
          selectedItems={selectedItems}
          select={this.selectItemsHandler}
          deselect={this.deselectItemsHandler}
        />
      </div>
    )
  }
}

const MicroplanningWithIntl = injectIntl(Microplanning)

export default connect((state, ownProps) => ({
  config: state.config,
  villages: state.villages,
  selection: state.selection
}))(MicroplanningWithIntl)
