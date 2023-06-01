import React, { Component, FunctionComponent } from 'react';
import MarkersListComponent from '../../../../../components/maps/markers/MarkersListComponent';
import { circleColorMarkerOptions } from '../../../../../utils/map/mapUtils';
import { OrgUnit } from '../../../types/orgUnit';
import OrgUnitPopupComponent from '../../OrgUnitPopupComponent';

type Props = {
    PopupComponent?: FunctionComponent | Component;
    locationsList: any[];
    color?: string;
    keyId: string | number;
    // eslint-disable-next-line no-unused-vars
    fetchDetail: (orgUnit: OrgUnit) => void;
    // eslint-disable-next-line no-unused-vars
    updateOrgUnitLocation: (orgUnit: OrgUnit) => void;
};

export const MarkerList: FunctionComponent<Props> = ({
    locationsList,
    fetchDetail,
    color = '#000000',
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
