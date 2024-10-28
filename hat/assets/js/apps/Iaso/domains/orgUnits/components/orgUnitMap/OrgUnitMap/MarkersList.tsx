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
    updateOrgUnitLocation: (orgUnit: OrgUnit) => void;
    popupProps?: (orgUnit: OrgUnit) => Record<string, any>;
};

export const MarkerList: FunctionComponent<Props> = ({
    locationsList,
    color = '#000000',
    keyId,
    updateOrgUnitLocation,
    PopupComponent = OrgUnitPopupComponent,
    popupProps,
}) => {
    return (
        <MarkersListComponent
            key={keyId}
            items={locationsList}
            PopupComponent={PopupComponent}
            popupProps={orgUnit => ({
                displayUseLocation: true,
                replaceLocation: selectedOrgUnit =>
                    updateOrgUnitLocation(selectedOrgUnit),
                ...popupProps?.(orgUnit),
            })}
            isCircle
            markerProps={() => ({
                ...circleColorMarkerOptions(color),
            })}
        />
    );
};
