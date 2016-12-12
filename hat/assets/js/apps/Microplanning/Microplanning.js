import React, { Component } from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl'
import { createUrl } from '../../utils/fetchData'

import geoData from './utils/geoData'
import { Map } from './components'
import { selectItems, deselectItems } from './selection'

const MESSAGES = defineMessages({
  'location-all': {
    defaultMessage: 'All',
    id: 'microplanning.location.all'
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
    const villages = (data && data.villages || [])

    /*
    // REMOVE AFTER WORKSHOP
    const items = villages
    if (!loading && !error) {
      const year = new Date().getFullYear() - parseInt(caseyearfrom || 0, 10)
      if (year < 2016) {
        const defaultLastConfirmedCaseDate = '2015-12-31'
        const keys = ['ZS', 'AS', 'village']
        const {data2015, isEqual, areEqual} = geoData
        const extra2015 = (!location
          ? data2015
          : data2015.filter((item2015) => isEqual(item2015.ZS, location)))

        // add to fetched data 2015 entries
        if (extra2015.length) {
          items = villages.map((itemNo2015) => {
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
        }
      }
    }
    // !REMOVE AFTER WORKSHOP
    */

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
              <FormattedMessage id='microplanning.filter.screening.date' defaultMessage='and last time visited' />
            </label>
            <input type='number' disabled={loading} name='screeningyearto' min='0' value={screeningyearto || 0} onChange={this.screeningDateHandler} className='input--minimised' />
            <label className='filter__container__select__label__after'>
              <FormattedMessage id='microplanning.filter.years.ago' defaultMessage='years ago' />
            </label>
          </div>

          <div key='filter-location' className='filter__container__select'>
            <label htmlFor='location' className='filter__container__select__label'>
              <FormattedMessage id='microplanning.filter.location' defaultMessage='in the Zone de Sante' />
            </label>
            <select disabled={loading} name='location' value={location || ''} onChange={this.locationHandler} className='select--minimised'>
              <option key='all' value=''>
                {formatMessage(MESSAGES['location-all'])}
              </option>
              {geoData.locations.map((value) => (<option key={value} value={value}>{value}</option>))}
            </select>
          </div>
        </div>

        {
          error && <div className='widget__container'>
            <div className='widget__header'>
              <h2 className='widget__heading text--error'>
                <FormattedMessage id='microplanning.label.error' defaultMessage='Error' />:
              </h2>
            </div>
            <div className='widget__content'>
              {error}
            </div>
          </div>
        }

        {
          loading && <div className='widget__container'>
            <div className='widget__header'>
              <h2 className='widget__heading'>
                <i className='fa fa-spin fa-cog' />
                &nbsp;
                <FormattedMessage id='microplanning.label.loading' defaultMessage='Loading villages' />
                &hellip;
              </h2>
            </div>
          </div>
        }

        <Map
          items={villages}
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
