import React, { Fragment } from 'react';

import PropTypes from 'prop-types';

import { isValidCoordinate } from '../../../utils/mapUtils';

import MarkerComponent from './MarkerComponent';

const MarkersListComponent = (props) => {
    const {
        items,
        onMarkerClick,
        PopupComponent,
        customMarker,
        popupProps,
    } = props;

    return items.map((i) => {
        if (!i.latitude || !i.longitude || !isValidCoordinate(i.latitude, i.longitude)) return null;
        return (
            <Fragment key={i.id}>
                <MarkerComponent
                    item={i}
                    onClick={onMarkerClick}
                    PopupComponent={PopupComponent}
                    marker={customMarker}
                    popupProps={popupProps}
                />
            </Fragment>
        );
    });
};

MarkersListComponent.defaultProps = {
    items: [],
    PopupComponent: null,
    customMarker: null,
    popupProps: {},
};

MarkersListComponent.propTypes = {
    items: PropTypes.array,
    onMarkerClick: PropTypes.func.isRequired,
    PopupComponent: PropTypes.object,
    customMarker: PropTypes.object,
    popupProps: PropTypes.object,
};

export default MarkersListComponent;
