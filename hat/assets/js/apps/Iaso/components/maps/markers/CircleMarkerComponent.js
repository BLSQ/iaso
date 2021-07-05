import React from 'react';

import { CircleMarker } from 'react-leaflet';

import PropTypes from 'prop-types';
import { isValidCoordinate } from '../../../utils/mapUtils';

const CircleMarkerComponent = props => {
    const {
        item,
        onClick,
        PopupComponent,
        draggable,
        onDragend,
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
        <CircleMarker
            draggable={draggable}
            center={[item.latitude, item.longitude, item.altitude]}
            onClick={() => onClick(item)}
            onDragend={e => onDragend(e.target)}
            {...markerProps(item)}
        >
            {PopupComponent && <PopupComponent {...popupProps} />}
            {TooltipComponent && <TooltipComponent {...tooltipProps(item)} />}
        </CircleMarker>
    );
};

CircleMarkerComponent.defaultProps = {
    onClick: () => null,
    onDragend: () => null,
    PopupComponent: undefined,
    draggable: false,
    popupProps: {},
    markerProps: () => {},
    TooltipComponent: undefined,
    tooltipProps: () => {},
};

CircleMarkerComponent.propTypes = {
    item: PropTypes.object.isRequired,
    onClick: PropTypes.func,
    PopupComponent: PropTypes.object,
    onDragend: PropTypes.func,
    draggable: PropTypes.bool,
    popupProps: PropTypes.object,
    markerProps: PropTypes.func,
    TooltipComponent: PropTypes.elementType,
    tooltipProps: PropTypes.func,
};

export default CircleMarkerComponent;
