import React, { Fragment } from 'react';

import PropTypes from 'prop-types';

import { isValidCoordinate } from '../../../utils/mapUtils';

import MarkerComponent from './MarkerComponent';

const MarkersListComponent = (props) => {
    const {
        items,
        onMarkerClick,
        PopupComponent,
    } = props;

    return items.map((i) => {
        if (!i.latitude || !i.longitude || !isValidCoordinate(i.latitude, i.longitude)) return null;
        return (
            <Fragment key={i.id}>
                <MarkerComponent item={i} onMarkerClick={onMarkerClick} PopupComponent={PopupComponent} />
            </Fragment>
        );
    });
};

MarkersListComponent.defaultProps = {
    items: [],
};

MarkersListComponent.propTypes = {
    items: PropTypes.array,
    onMarkerClick: PropTypes.func.isRequired,
    PopupComponent: PropTypes.object.isRequired,
};

export default MarkersListComponent;
