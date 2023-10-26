import React from 'react';

import { Marker } from 'react-leaflet';

import PropTypes from 'prop-types';

import {
    customMarker,
    isValidCoordinate,
} from '../../../utils/map/mapUtils.ts';

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
        onContextmenu,
    } = props;
    if (!item || !isValidCoordinate(item.latitude, item.longitude)) return null;
    return (
        <Marker
            draggable={draggable}
            icon={marker || customMarker}
            position={[item.latitude, item.longitude, item.altitude]}
            eventHandlers={{
                click: () => onClick(item),
                dragend: e => onDragend(e.target),
            }}
            {...markerProps(item)}
            onContextmenu={event => onContextmenu(event, item)}
        >
            {PopupComponent && <PopupComponent {...popupProps(item)} />}
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
    popupProps: () => {},
    markerProps: () => {},
    TooltipComponent: undefined,
    tooltipProps: () => {},
    onContextmenu: () => {},
};

MarkerComponent.propTypes = {
    item: PropTypes.object.isRequired,
    onClick: PropTypes.func,
    PopupComponent: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    onDragend: PropTypes.func,
    draggable: PropTypes.bool,
    marker: PropTypes.object,
    popupProps: PropTypes.func,
    markerProps: PropTypes.func,
    TooltipComponent: PropTypes.elementType,
    tooltipProps: PropTypes.func,
    onContextmenu: PropTypes.func,
};

export default MarkerComponent;
