import React, {Component, PropTypes} from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'

class MapSelectionControl extends Component {
  render () {
    const {mode, modes, bufferSize, modeChange, bufferChange} = this.props

    if (!mode || mode === modes.none) {
      return (
        <div
          className='map__control__button--selection'
          onClick={() => modeChange(modes.select)}>
          <i className='map__icon--select' />
          <span className='map__text--select'>
            <FormattedMessage id='microplanning.selection.active' defaultMessage='Select villages' />
          </span>
        </div>
      )
    }

    return (
      <div>
        <div
          className='map__control__button--selection'
          onClick={() => modeChange(modes.select)}>
          <i className={'map__icon--select' + (mode === modes.select ? '--active' : '')} />
          <span className='map__text--select'>
            <FormattedMessage id='microplanning.selection.active.select' defaultMessage='Select villages' />
          </span>
        </div>
        <div
          className='map__control__button--selection'
          onClick={() => modeChange(modes.deselect)}>
          <i className={'map__icon--select' + (mode === modes.deselect ? '--active' : '')} />
          <span className='map__text--select'>
            <FormattedMessage id='microplanning.selection.active.deselect' defaultMessage='Deselect villages' />
          </span>
        </div>
        <div className='map__control__button--selection'>
          <span className='map__text--select'>
            <FormattedMessage id='microplanning.selection.buffer' defaultMessage='Selection buffer' />
          </span>
          <input type='number' className='small' name='buffer-value' value={bufferSize} onChange={bufferChange} />
          <span className='map__text--select'>{'km'}</span>
        </div>
        <div
          className='map__control__button--selection'
          onClick={() => modeChange(modes.none)}>
          <i className='fa fa-close' />
          <span className='map__text--select'>
            <FormattedMessage id='microplanning.selection.inactive' defaultMessage='Cancel' />
          </span>
        </div>
      </div>
    )
  }
}

Map.MapSelectionControl = {
  mode: PropTypes.string,
  modes: PropTypes.object,
  modeChange: PropTypes.func,
  bufferChange: PropTypes.func
}

export default injectIntl(MapSelectionControl)
