import React, { FunctionComponent, useCallback } from 'react';
import { Pane } from 'react-leaflet';

import MarkerComponent from '../../../../../components/maps/markers/MarkerComponent';
import { OrgUnit } from '../../../types/orgUnit';
import { orgunitsPane } from './constants';

type Props = {
    isEdit: boolean;
    currentOrgUnit: OrgUnit;
    onChangeLocation: (location) => void;
};
export const CurrentOrgUnitMarker: FunctionComponent<Props> = ({
    isEdit,
    currentOrgUnit,
    onChangeLocation,
}) => {
    const handleChangeLocation = useCallback(
        newMarker => {
            const { lat, lng, alt = 0 } = newMarker.getLatLng();
            onChangeLocation({
                latitude: lat,
                longitude: lng,
                altitude: alt,
            });
        },
        [onChangeLocation],
    );
    return (
        <Pane name={`${orgunitsPane}-current-marker`} style={{ zIndex: 699 }}>
            <MarkerComponent
                item={currentOrgUnit}
                draggable={isEdit}
                onDragend={handleChangeLocation}
            />
        </Pane>
    );
};
