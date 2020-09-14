import React, { Fragment } from 'react';

import PropTypes from 'prop-types';

import { isValidCoordinate } from '../../../utils/mapUtils';

import MarkerComponent from './MarkerComponent';
import CircleMarkerComponent from './CircleMarkerComponent';

const MarkersListComponent = props => {
    const {
        items,
        onMarkerClick,
        PopupComponent,
        customMarker,
        popupProps,
        markerProps,
        isCircle,
    } = props;

    return items.map(i => {
        if (
            !i.latitude ||
            !i.longitude ||
            !isValidCoordinate(i.latitude, i.longitude)
        )
            return null;
        return (
            <Fragment key={i.id}>
                {!isCircle && (
                    <MarkerComponent
                        item={i}
                        onClick={onMarkerClick}
                        PopupComponent={PopupComponent}
                        marker={customMarker}
                        popupProps={popupProps}
                        markerProps={markerProps}
                    />
                )}
                {isCircle && (
                    <CircleMarkerComponent
                        item={i}
                        onClick={onMarkerClick}
                        PopupComponent={PopupComponent}
                        popupProps={popupProps}
                        markerProps={markerProps}
                    />
                )}
            </Fragment>
        );
    });
};

MarkersListComponent.defaultProps = {
    items: [],
    PopupComponent: null,
    customMarker: null,
    popupProps: {},
    markerProps: () => {},
    isCircle: false,
};

MarkersListComponent.propTypes = {
    items: PropTypes.array,
    onMarkerClick: PropTypes.func.isRequired,
    PopupComponent: PropTypes.object,
    customMarker: PropTypes.object,
    popupProps: PropTypes.object,
    markerProps: PropTypes.func,
    isCircle: PropTypes.bool,
};

export default MarkersListComponent;
