import React from 'react';

import { CircleMarker } from 'react-leaflet';

import PropTypes from 'prop-types';
import { isValidCoordinate } from '../../../utils/map/mapUtils.ts';

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
        onContextmenu,
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
            eventHandlers={{
                click: () => onClick(item),
                dragend: e => onDragend(e.target),
            }}
            {...markerProps(item)}
            onContextmenu={event => {
                onContextmenu(event, item);
            }}
        >
            {PopupComponent && <PopupComponent {...popupProps(item)} />}
            {TooltipComponent && <TooltipComponent {...tooltipProps(item)} />}
        </CircleMarker>
    );
};

CircleMarkerComponent.defaultProps = {
    onClick: () => null,
    onDragend: () => null,
    PopupComponent: undefined,
    draggable: false,
    popupProps: () => {},
    markerProps: () => {},
    TooltipComponent: undefined,
    tooltipProps: () => {},
    onContextmenu: () => {},
};

CircleMarkerComponent.propTypes = {
    item: PropTypes.object.isRequired,
    onClick: PropTypes.func,
    PopupComponent: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    onDragend: PropTypes.func,
    draggable: PropTypes.bool,
    popupProps: PropTypes.func,
    markerProps: PropTypes.func,
    TooltipComponent: PropTypes.elementType,
    tooltipProps: PropTypes.func,
    onContextmenu: PropTypes.func,
};

export default CircleMarkerComponent;
