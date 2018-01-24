/*
 * This component allow as to activate/deactivate the selection actions.
 *
 * Activate selection will draw a buffer circle (size depends on
 * `bufferSize` value) in the map that will follow mouse movements.
 * Every click on it will fire the selection action and all the overlayed
 * markers will be selected/deselected.
 *
 * There is one special selection that will take ALL the villages around
 * the ones flagged as highlighted. The `highlightBufferSize` will determine
 * which ones. A zero value indicates that only the highlight villages are taken.
 */

import React, { Component, PropTypes } from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
import { selectionModes } from '../redux/selection'

class MapSelectionControl extends Component {
  render () {
    const {mode, changeMode} = this.props
    const {bufferSize, changeBufferSize} = this.props
    const {highlightBufferSize, changeHighlightBufferSize, selectHighlightBuffer} = this.props

    return (
      <div className='map__selection__control__container'>
        {this.props.coordinationId && !this.props.teamId &&
        <div>
          <div className='map__selection__actions'>
              <span className='map__text--select'>
                <FormattedMessage id='microplanning.selection.buffer.highlight' defaultMessage='Taille zone tampon'/>
              </span>
            <input type='number' className='small' min='0' name='buffer-value' value={highlightBufferSize}
                   onChange={changeHighlightBufferSize}/>
            <span className='map__text--select'>{'km'}</span>
          </div>

          <div
            className='map__control__button--highlight'
            onClick={() => selectHighlightBuffer()}>
              <span className='map__text--select'>
                <FormattedMessage id='microplanning.selection.active.select' defaultMessage='Assigner villages'/>
                &nbsp;
                <FormattedMessage id='microplanning.selection.buffer.highlight.label'
                                  defaultMessage='autour des cas confirmés'/>
              </span>
          </div>


        </div>
        }

        {this.props.coordinationId &&
        <div className='map__selection__actions tooltip--warning'>
            <span className='map__text--select'>
              <FormattedMessage id='microplanning.selection.buffer' defaultMessage='Selection buffer'/>
            </span>
          <input type='number' className='small' min='1' name='buffer-value' value={bufferSize}
                 onChange={changeBufferSize}/>
          <span className='map__text--select'>{'km'}</span>

          <div className='tooltip__warning'>
            <FormattedMessage
              id='microplanning.selection.actions.buffer.explanation'
              defaultMessage='You can adjust the size of selection buffer zone to include/remove more/fewer villages in your selection.'/>
          </div>
        </div>
        }

        {this.props.teamId && <div
          className={'map__control__button--selection--select' + (mode === selectionModes.select ? '--active' : '')}
          onClick={() => changeMode(selectionModes.select)}>
          <i className='map__icon--select'/>
          <span className='map__text--select'>
            <FormattedMessage id='microplanning.selection.active.select' defaultMessage='Select. villages'/>
          </span>
        </div>
        }

        {this.props.coordinationId && <div
          className={'map__control__button--selection--deselect' + (mode === selectionModes.deselect ? '--active' : '')}
          onClick={() => changeMode(selectionModes.deselect)}>
          <i className='map__icon--select'/>
          <span className='map__text--select'>
            <FormattedMessage id='microplanning.selection.active.deselect' defaultMessage='Deselect. villages'/>
          </span>
        </div>
        }


      </div>
    )
  }
}

MapSelectionControl.propTypes = {
  teamId: PropTypes.string,
  coordinationId:  PropTypes.string,
  mode: PropTypes.number,
  changeMode: PropTypes.func,
  bufferSize: PropTypes.number,
  changeBufferSize: PropTypes.func,
  highlightBufferSize: PropTypes.number,
  changeHighlightBufferSize: PropTypes.func,
  selectHighlightBuffer: PropTypes.func
}

export default injectIntl(MapSelectionControl)
