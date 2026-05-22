import React, { FunctionComponent } from 'react';
import { Marker } from 'react-leaflet';

import { customMarker, isValidCoordinate } from '../../../utils/map/mapUtils';

type Props = {
    item: Record<string, any>;
    onClick?: (item: any) => void;
    PopupComponent?: any;
    onDragend?: (target?: any) => void;
    draggable?: boolean;
    popupProps?: (item: any) => any;
    markerProps?: (item: any) => any;
    TooltipComponent?: React.ComponentType<any>;
    tooltipProps?: (item: any) => any;
    onContextmenu?: (event: any, item: any) => void;
    onDblclick?: (event: any, item: any) => void;
    marker?: Record<string, any>;
};

const MarkerComponent: FunctionComponent<Props> = ({
    item,
    PopupComponent,
    TooltipComponent,
    marker,
    draggable = false,
    onClick = () => null,
    onDblclick = () => {},
    onDragend = () => null,
    markerProps = () => {},
    popupProps = () => {},
    tooltipProps = () => {},
    onContextmenu = () => {},
}) => {
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

export default MarkerComponent;
