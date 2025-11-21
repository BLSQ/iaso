import React, { Fragment, FunctionComponent } from 'react';
import { isValidCoordinate } from '../../../utils/map/mapUtils';
import CircleMarkerComponent from './CircleMarkerComponent';
import MarkerComponent from './MarkerComponent';

type Props = {
    items?: Record<string, any>[];
    PopupComponent?: any;
    TooltipComponent?: React.ComponentType<any>;
    customMarker?: Record<string, any>;
    onMarkerClick: (item: any) => void;
    isCircle?: boolean;
    onDblclick?: (event: any, item: any) => void;
    markerProps?: (item: any) => any;
    popupProps?: (item: any) => any;
    tooltipProps?: (item: any) => any;
    onContextmenu?: (event: any, item: any) => void;
};

const MarkersListComponent: FunctionComponent<Props> = ({
    items = [],
    PopupComponent,
    TooltipComponent,
    customMarker,
    onMarkerClick = () => null,
    isCircle = false,
    onDblclick = () => {},
    markerProps = () => {},
    popupProps = () => {},
    tooltipProps = () => {},
    onContextmenu = () => {},
}) => {
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
                        TooltipComponent={TooltipComponent}
                        marker={customMarker}
                        popupProps={popupProps}
                        markerProps={markerProps}
                        onContextmenu={onContextmenu}
                        onDblclick={onDblclick}
                    />
                )}
                {isCircle && (
                    <CircleMarkerComponent
                        item={i}
                        onClick={onMarkerClick}
                        PopupComponent={PopupComponent}
                        TooltipComponent={TooltipComponent}
                        popupProps={popupProps}
                        markerProps={markerProps}
                        tooltipProps={tooltipProps}
                        onContextmenu={onContextmenu}
                        onDblclick={onDblclick}
                    />
                )}
            </Fragment>
        );
    });
};

export default MarkersListComponent;
