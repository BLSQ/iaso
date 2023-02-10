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
    const name = isEdit
        ? `${orgunitsPane}-edit-markers`
        : `${orgunitsPane}-current-marker`;
    return (
        <Pane name={name} style={{ zIndex: 699 }}>
            <MarkerComponent
                item={currentOrgUnit}
                draggable={isEdit}
                onDragend={newMarker => onChangeLocation(newMarker.getLatLng())}
            />
        </Pane>
    );
};
