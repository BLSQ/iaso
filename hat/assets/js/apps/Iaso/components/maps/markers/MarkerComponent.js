import React from 'react';

import { Marker } from 'react-leaflet';

import PropTypes from 'prop-types';

import { customMarker, isValidCoordinate } from '../../../utils/mapUtils';

const MarkerComponent = props => {
    const {
        item,
        onClick,
        PopupComponent,
        draggable,
        onDragend,
        marker,
        markerProps,
        popupProps,
        TooltipComponent,
        tooltipProps,
    } = props;
    if (
        !item ||
        !item.latitude ||
        !item.longitude ||
        !isValidCoordinate(item.latitude, item.longitude)
    )
        return null;
    return (
        <Marker
            draggable={draggable}
            icon={marker || customMarker}
            position={[item.latitude, item.longitude]}
            onClick={() => onClick(item)}
            onDragend={e => onDragend(e.target)}
            {...markerProps(item)}
        >
            {PopupComponent && <PopupComponent {...popupProps} />}
            {TooltipComponent && <TooltipComponent {...tooltipProps(item)} />}
        </Marker>
    );
};

MarkerComponent.defaultProps = {
    onClick: () => null,
    onDragend: () => null,
    PopupComponent: undefined,
    draggable: false,
    marker: null,
    popupProps: {},
    markerProps: () => {},
    TooltipComponent: undefined,
    tooltipProps: () => {},
};

MarkerComponent.propTypes = {
    item: PropTypes.object.isRequired,
    onClick: PropTypes.func,
    PopupComponent: PropTypes.object,
    onDragend: PropTypes.func,
    draggable: PropTypes.bool,
    marker: PropTypes.object,
    popupProps: PropTypes.object,
    markerProps: PropTypes.func,
    TooltipComponent: PropTypes.elementType,
    tooltipProps: PropTypes.func,
};

export default MarkerComponent;
