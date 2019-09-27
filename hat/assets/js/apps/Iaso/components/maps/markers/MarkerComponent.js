import React from 'react';

import {
    Marker,
} from 'react-leaflet';

import PropTypes from 'prop-types';

import { customMarker } from '../../../utils/mapUtils';

const MarkerComponent = (props) => {
    const {
        item,
        onClick,
        PopupComponent,
        draggable,
        onDragend,
        marker,
    } = props;
    return (
        <Marker
            draggable={draggable}
            icon={marker || customMarker}
            position={[item.latitude, item.longitude]}
            onClick={() => onClick(item)}
            onDragend={e => onDragend(e.target)}
        >
            {
                PopupComponent && <PopupComponent itemId={item.id} />
            }
        </Marker>
    );
};

MarkerComponent.defaultProps = {
    onClick: () => null,
    onDragend: () => null,
    PopupComponent: undefined,
    draggable: false,
    marker: null,
};

MarkerComponent.propTypes = {
    item: PropTypes.object.isRequired,
    onClick: PropTypes.func,
    PopupComponent: PropTypes.object,
    onDragend: PropTypes.func,
    draggable: PropTypes.bool,
    marker: PropTypes.object,
};

export default MarkerComponent;
