import React from 'react';

import {
    Marker,
} from 'react-leaflet';

import PropTypes from 'prop-types';

import { customMarker } from '../../../utils/mapUtils';

const MarkerComponent = (props) => {
    const {
        item,
        onMarkerClick,
        PopupComponent,
    } = props;
    return (
        <Marker
            icon={customMarker}
            position={[item.latitude, item.longitude]}
            onClick={() => onMarkerClick(item)}
        >
            <PopupComponent itemId={item.id} />
        </Marker>
    );
};

MarkerComponent.propTypes = {
    item: PropTypes.object.isRequired,
    onMarkerClick: PropTypes.func.isRequired,
    PopupComponent: PropTypes.object.isRequired,
};

export default MarkerComponent;
