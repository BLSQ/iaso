import React, { FunctionComponent } from 'react';
import { Pane } from 'react-leaflet';

import { orgunitsPane } from './constants';
import MarkerComponent from '../../../../../components/maps/markers/MarkerComponent';
import { OrgUnit } from '../../../types/orgUnit';

type Props = {
    isEdit: boolean;
    currentOrgUnit: OrgUnit;
    // eslint-disable-next-line no-unused-vars
    onChangeLocation: (location) => void;
};
export const CurrentOrgUnitMarker: FunctionComponent<Props> = ({
    isEdit,
    currentOrgUnit,
    onChangeLocation,
}) => {
    return (
        <Pane name={`${orgunitsPane}-current-marker`} style={{ zIndex: 699 }}>
            <MarkerComponent
                item={currentOrgUnit}
                draggable={isEdit}
                onDragend={newMarker => onChangeLocation(newMarker.getLatLng())}
            />
        </Pane>
    );
};
