import React, { Component } from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl'
import { createUrl } from '../../utils/fetchData'

import { Map } from './components'

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

  render () {
    const { formatMessage } = this.props.intl
    const { caseyearfrom, screeningyearto, location } = this.props.params
    const { data, error } = this.props.villages
    const loading = this.props.villages.loading
    const highlightedItems = (data && data.confirmedByLocation || [])
    // extract unique zones from fetched data
    const locations = highlightedItems
      .map((item) => item.zone)
      .filter((value, index, array) => array.indexOf(value) === index)

    return (
      <div>
        <div className='filter__container'>
          <h2 className='filter__label'>
            <FormattedMessage id='microplanning.filter.highlight' defaultMessage='Highlight villages' />
          </h2>

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
              {locations.map((loc) => (<option key={loc} value={loc}>{loc}</option>))}
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

        <Map highlightedItems={highlightedItems} />
      </div>
    )
  }
}

const MicroplanningWithIntl = injectIntl(Microplanning)

export default connect((state, ownProps) => ({
  config: state.config,
  villages: state.villages
}))(MicroplanningWithIntl)
