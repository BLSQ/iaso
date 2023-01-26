import React from 'react';
import MarkersListComponent from '../../../../../components/maps/markers/MarkersListComponent';
import { circleColorMarkerOptions } from '../../../../../utils/mapUtils';
import OrgUnitPopupComponent from '../../OrgUnitPopupComponent';

export const MarkerList = ({
    locationsList,
    fetchDetail,
    color,
    keyId,
    updateOrgUnitLocation,
    PopupComponent = OrgUnitPopupComponent,
}) => {
    return (
        <MarkersListComponent
            key={keyId}
            items={locationsList}
            onMarkerClick={fetchDetail}
            PopupComponent={PopupComponent}
            popupProps={() => ({
                displayUseLocation: true,
                replaceLocation: selectedOrgUnit =>
                    updateOrgUnitLocation(selectedOrgUnit),
            })}
            isCircle
            markerProps={() => ({
                ...circleColorMarkerOptions(color),
            })}
        />
    );
};
