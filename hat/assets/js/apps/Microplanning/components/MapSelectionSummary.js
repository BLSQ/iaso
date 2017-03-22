/*
 * This component displays the summary of the selected villages.
 */

import React, {Component, PropTypes} from 'react'
import {FormattedMessage, injectIntl} from 'react-intl'

class MapSelectionSummary extends Component {
  render () {
    const {data} = this.props

    if (!data || data.length === 0) {
      return (
        <div className='map__selection__summary--empty'>
          <FormattedMessage id='microplanning.selected.empty' defaultMessage='Nothing selected yet.' />
        </div>
      )
    }

    // calculate total villages population
    const population = data.reduce((prev, curr) => (prev + (curr.population || 0)), 0)

    return (
      <div className='map__selection__summary'>
        <h4 className='map__selection__summary__heading'>
          <FormattedMessage
            id='microplanning.selected.selection.title'
            defaultMessage='Your selection includes:'
          />
        </h4>
        <div className='map__selection__summary__item'>
          <FormattedMessage
            id='microplanning.selected.number'
            defaultMessage='Villages'
          />
          <span className='map__selection__summary__number'>{data.length}</span>
        </div>

        <div className='map__selection__summary__item tooltip--warning'>
          <FormattedMessage
            id='microplanning.selected.population'
            defaultMessage='Estimated population'
          />
          <span className='map__selection__summary__number'>{population}</span>

          <div className='tooltip__warning'>
            <FormattedMessage
              id='microplanning.selected.population.warning.1'
              defaultMessage='Please note: population estimates may not be accurate.'
            />
            &nbsp;
            <FormattedMessage
              id='microplanning.selected.population.warning.2'
              defaultMessage='Only villages from Z.S. have population data.'
            />
            <br />
            <FormattedMessage
              id='microplanning.selected.population.warning.3'
              defaultMessage='Population data included in shape files curated by UCLA and based on Villages from Z.S.'
            />
          </div>
        </div>
      </div>
    )
  }
}

MapSelectionSummary.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object)
}

export default injectIntl(MapSelectionSummary)
