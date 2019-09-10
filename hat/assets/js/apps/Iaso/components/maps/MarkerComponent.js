import React from 'react';

import {
    Marker,
} from 'react-leaflet';

import PropTypes from 'prop-types';

const MarkerComponent = (props) => {
    const {
        item,
        onMarkerClick,
        PopupComponent,
    } = props;
    return (
        <Marker
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
