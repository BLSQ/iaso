import React, { Fragment } from 'react';

import PropTypes from 'prop-types';

import { isValidCoordinate } from '../../utils/mapUtils';

import MarkerComponent from './MarkerComponent';
import InstancePopupComponent from './InstancePopupComponent';

const InstancesMarkersComponent = (props) => {
    const {
        items,
        onMarkerClick,
    } = props;


    return items.map((i) => {
        if (!i.latitude || !i.longitude || !isValidCoordinate(i.latitude, i.longitude)) return null;
        return (
            <Fragment key={i.id}>
                <MarkerComponent item={i} onMarkerClick={onMarkerClick} PopupComponent={InstancePopupComponent} />
            </Fragment>
        );
    });
};

InstancesMarkersComponent.defaultProps = {
    items: [],
};

InstancesMarkersComponent.propTypes = {
    items: PropTypes.array,
    onMarkerClick: PropTypes.func.isRequired,
};

export default InstancesMarkersComponent;
