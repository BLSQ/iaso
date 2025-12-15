import React, { FunctionComponent } from 'react';
import { CircleMarker } from 'react-leaflet';
import { isValidCoordinate } from '../../../utils/map/mapUtils';

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
};

const CircleMarkerComponent: FunctionComponent<Props> = ({
    item,
    PopupComponent,
    TooltipComponent,
    onClick = () => null,
    onDblclick = () => {},
    draggable = false,
    onDragend = () => null,
    markerProps = () => {},
    popupProps = () => {},
    tooltipProps = () => {},
    onContextmenu = () => {},
}) => {
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
                click: e => {
                    e.originalEvent.stopPropagation();
                    onClick(item);
                },
                dragend: e => onDragend(e.target),
                dblclick: e => onDblclick(e, item),
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

export default CircleMarkerComponent;
