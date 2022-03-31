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
        TooltipComponent,
        customMarker,
        popupProps,
        markerProps,
        isCircle,
        tooltipProps,
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
    popupProps: {},
    markerProps: () => {},
    tooltipProps: () => {},
    isCircle: false,
};

MarkersListComponent.propTypes = {
    items: PropTypes.array,
    onMarkerClick: PropTypes.func.isRequired,
    PopupComponent: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    TooltipComponent: PropTypes.elementType,
    customMarker: PropTypes.object,
    tooltipProps: PropTypes.func,
    popupProps: PropTypes.object,
    markerProps: PropTypes.func,
    isCircle: PropTypes.bool,
};

export default MarkersListComponent;
