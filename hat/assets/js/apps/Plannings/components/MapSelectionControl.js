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

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import { selectionModes } from '../redux/selection';

class MapSelectionControl extends Component {
    render() {
        const {
            highlightBufferSize,
            changeHighlightBufferSize,
            selectHighlightBuffer,
        } = this.props;
        return (
            <div className="map__selection__control__container">
                {this.props.workzoneId && !this.props.teamId &&
                    <div>
                        <div className="map__selection__actions">
                            <span className="map__text--select">
                                <FormattedMessage id="microplanning.selection.buffer.highlight" defaultMessage="Taille zone tampon" />
                            </span>
                            <input
                                type="number"
                                className="small"
                                min="0"
                                name="buffer-value"
                                value={highlightBufferSize}
                                onChange={changeHighlightBufferSize}
                            />
                            <span className="map__text--select">km</span>
                        </div>

                        <div
                            tabIndex={0}
                            role="button"
                            className="map__control__button--highlight"
                            onClick={() => selectHighlightBuffer()}
                        >
                            <span className="map__text--select">
                                <FormattedMessage id="microplanning.selection.active.assign" defaultMessage="Assign villages" />
                                &nbsp;
                                <FormattedMessage
                                    id="microplanning.selection.buffer.highlight.label"
                                    defaultMessage="autour des cas confirmés"
                                />
                            </span>
                        </div>


                    </div>
                }
            </div>
        );
    }
}
MapSelectionControl.defaultProps = {
    teamId: '',
    workzoneId: '',
    mode: 0,
    highlightBufferSize: 0,
    changeHighlightBufferSize: () => {},
    selectHighlightBuffer: () => {},
};


MapSelectionControl.propTypes = {
    teamId: PropTypes.string,
    workzoneId: PropTypes.string,
    mode: PropTypes.number,
    highlightBufferSize: PropTypes.number,
    changeHighlightBufferSize: PropTypes.func,
    selectHighlightBuffer: PropTypes.func,
};

export default injectIntl(MapSelectionControl);
