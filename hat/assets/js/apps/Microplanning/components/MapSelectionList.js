/*
 * This component displays the list of selected villages. It also allows to
 * remove (`deselect`) them from the list (one by one or all together),
 * or to identify the selected village in the the map (`show`).
 */

import React, {Component, PropTypes} from 'react'
import {FormattedMessage, injectIntl} from 'react-intl'

class MapSelectionList extends Component {
  render () {
    const {data, show, deselect} = this.props

    if (!data || data.length === 0) {
      return <div />
    }

    return (
      <div>
        <div className='map__selection__list__header'>
          <h3>
            <FormattedMessage id='microplanning.selected.list' defaultMessage='Village list:' />
          </h3>
          <a onClick={() => deselect()} className='button--tiny button--danger'>
            <FormattedMessage id='microplanning.selected.reset' defaultMessage='Deselect all' />
          </a>
        </div>

        <ul className='map__selection__list'>
          {data.map((item) => {
            return (
              <li className='map__selection__list__item' key={item.id}>
                <span className='remove' onClick={() => deselect([item])}>
                  <i className='fa fa-close' />
                </span>
                <span
                  className={'view text--' + (item._isHighlight ? 'highlight' : item.type)}
                  onClick={() => show(item)}>
                  <i className='fa fa-map-marker' />
                </span>
                <span>
                  {item.AS}
                  {' - '}
                  {item.village}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }
}

MapSelectionList.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  show: PropTypes.func,
  deselect: PropTypes.func
}

export default injectIntl(MapSelectionList)
