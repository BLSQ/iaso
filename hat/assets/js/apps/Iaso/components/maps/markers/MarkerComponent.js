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
        onDblclick,
    } = props;
    if (!item || !isValidCoordinate(item.latitude, item.longitude)) return null;
    return (
        <Marker
            draggable={draggable}
            icon={marker || customMarker}
            position={[item.latitude, item.longitude, item.altitude]}
            eventHandlers={{
                click: e => {
                    e.originalEvent.stopPropagation();
                    onClick(item);
                },
                dragend: e => onDragend(e.target),
                dblclick: e => onDblclick(e, item),
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
    onDblclick: () => {},
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
    onDblclick: PropTypes.func,
};

export default MarkerComponent;
