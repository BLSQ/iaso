import React, {Component, PropTypes} from 'react'
import {
  FormattedDate,
  FormattedMessage,
  injectIntl,
  intlShape
} from 'react-intl'

class MapTooltip extends Component {
  render () {
    const {item} = this.props

    return (
      <div ref={(node) => (this.container = node)} className='tooltip'>
        { /* ITEM */ }
        { item.zone &&
          <div key='property-zone' className='property'>
            <div className='label'>
              <FormattedMessage id='microplanning.tooltip.zone' defaultMessage='Zone de Sante' />
            </div>
            <div className='value'>
              {item.zone}
            </div>
          </div>
        }
        { item.area &&
          <div key='property-area' className='property'>
            <div className='label'>
              <FormattedMessage id='microplanning.tooltip.area' defaultMessage='Aire de Sante' />
            </div>
            <div className='value'>
              {item.area}
            </div>
          </div>
        }

        { item.isVillage && [
          <div key='property-village' className='property'>
            <div className='label'>
              <FormattedMessage id='microplanning.tooltip.village' defaultMessage='Village' />
            </div>
            <div className='value'>
              { item.village}
            </div>
          </div>,

          <div key='property-coords' className='property'>
            <div className='label'>
              <FormattedMessage id='microplanning.tooltip.coordinates' defaultMessage='Coordinates' />
            </div>
            <div className='value'>
              {' [ '}{item.lat.toFixed(6)}{', '}{item.lon.toFixed(6)}{' ] '}
            </div>
          </div>
        ]}

        { !item.isVillage && [
          <div key='property-villages-official' className='property'>
            <div className='label'>
              <FormattedMessage id='microplanning.tooltip.villages.official' defaultMessage='Villages' />
            </div>
            <div className='value'>
              {item.villages.official || 0}
            </div>
          </div>,

          <div key='property-villages-other' className='property'>
            <div className='label'>
              <FormattedMessage id='microplanning.tooltip.villages.other' defaultMessage='Non official' />
            </div>
            <div className='value'>
              {item.villages.other || 0}
            </div>
          </div>,

          <div key='property-villages-unknown' className='property'>
            <div className='label'>
              <FormattedMessage id='microplanning.tooltip.villages.unknown' defaultMessage='Unknown' />
            </div>
            <div className='value'>
              {item.villages.unknown || 0}
            </div>
          </div>
        ]}

        { item.population > 0 &&
          <div key='property-population' className='property'>
            <div className='label'>
              <FormattedMessage id='microplanning.tooltip.population' defaultMessage='Population' />
            </div>
            <div className='value'>
              {item.population}
            </div>
          </div>
        }

        { /* HIGHLIGHT INFO */ }
        { item.cases > 0 &&
          <div key='property-cases' className='property'>
            <div className='label'>
              <FormattedMessage id='microplanning.tooltip.cases' defaultMessage='# Cases' />
            </div>
            <div className='value'>
              {item.cases}
            </div>
          </div>
        }
        { item.caseDate && item.caseDate !== '' &&
          <div key='property-case-date' className='property'>
            <div className='label'>
              <FormattedMessage id='microplanning.tooltip.case.date' defaultMessage='Last case date' />
            </div>
            <div className='value'>
              <FormattedDate value={item.caseDate} />
            </div>
          </div>
        }
        { item.visitDate && item.visitDate !== '' &&
          <div key='property-visit-date' className='property'>
            <div className='label'>
              <FormattedMessage id='microplanning.tooltip.visit.date' defaultMessage='Last visit date' />
            </div>
            <div className='value'>
              <FormattedDate value={item.visitDate} />
            </div>
          </div>
        }
      </div>
    )
  }
}

MapTooltip.propTypes = {
  item: PropTypes.object.isRequired,
  intl: intlShape.isRequired
}

export default injectIntl(MapTooltip)
