import React, { Component } from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl'
import Select from 'react-select'

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
    this.locationHandler = this.locationHandler.bind(this)
    this.selectItemsHandler = this.selectItemsHandler.bind(this)
    this.deselectItemsHandler = this.deselectItemsHandler.bind(this)
  }

  caseDateHandler (event) {
    const caseyearfrom = parseInt(event.target.value, 10)
    const url = createUrl({...this.props.params, caseyearfrom})
    this.props.dispatch(push(url))
  }

  locationHandler (location) {
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
    const { caseyearfrom, location } = this.props.params
    const { data, error, loading } = this.props.villages
    const selectedItems = (this.props.selection.selectedItems || [])
    const villages = (data && data.villages || [])

    return (
      <div>
        <div className='filter__container filter__container--reduced'>
          <h4 className='block--margin-bottom--xxs'>
            <FormattedMessage id='microplanning.filter.query' defaultMessage='Show villages:' />
          </h4>
        </div>
        <div className='filter__container'>
          <div key='filter-location' className='filter__container__multiselect'>
            <label htmlFor='location' className='filter__container__select__label'>
              <FormattedMessage id='microplanning.filter.location' defaultMessage='in the Zones de Sante' />
            </label>
            <span>
              <Select
                multi
                simpleValue
                autosize={false}
                name='location'
                value={location || ''}
                placeholder={formatMessage(MESSAGES['location-all'])}
                options={geoData.locations.map((value) => ({label: value, value}))}
                onChange={this.locationHandler}
              />
            </span>
          </div>
        </div>

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
