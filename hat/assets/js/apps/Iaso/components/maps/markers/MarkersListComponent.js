import React, { Fragment } from 'react';

import PropTypes from 'prop-types';

import { isValidCoordinate } from '../../../utils/map/mapUtils.ts';

import CircleMarkerComponent from './CircleMarkerComponent';
import MarkerComponent from './MarkerComponent';

const MarkersListComponent = props => {
    const {
        items,
        onMarkerClick,
        PopupComponent,
        TooltipComponent,
        customMarker,
        popupProps,
        markerProps,
        isCircle,
        tooltipProps,
        onContextmenu,
        onDblclick,
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

MarkersListComponent.defaultProps = {
    items: [],
    PopupComponent: null,
    TooltipComponent: undefined,
    customMarker: null,
    popupProps: () => {},
    markerProps: () => {},
    tooltipProps: () => {},
    isCircle: false,
    onContextmenu: () => {},
    onMarkerClick: () => null,
    onDblclick: () => {},
};

MarkersListComponent.propTypes = {
    items: PropTypes.array,
    onMarkerClick: PropTypes.func,
    PopupComponent: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    TooltipComponent: PropTypes.elementType,
    customMarker: PropTypes.object,
    tooltipProps: PropTypes.func,
    popupProps: PropTypes.func,
    markerProps: PropTypes.func,
    isCircle: PropTypes.bool,
    onContextmenu: PropTypes.func,
    onDblclick: PropTypes.func,
};

export default MarkersListComponent;
