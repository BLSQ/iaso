import React, { Component, FunctionComponent, useState } from 'react';
import MarkersListComponent from '../../../../../components/maps/markers/MarkersListComponent';
import { circleColorMarkerOptions } from '../../../../../utils/map/mapUtils';
import { useGetInstance } from '../../../../registry/hooks/useGetInstances';
import { OrgUnit } from '../../../types/orgUnit';
import OrgUnitPopupComponent from '../../OrgUnitPopupComponent';

type Props = {
    PopupComponent?: FunctionComponent | Component;
    locationsList: any[];
    color?: string;
    keyId: string | number;
    updateOrgUnitLocation: (orgUnit: OrgUnit) => void;
};

export const MarkerList: FunctionComponent<Props> = ({
    locationsList,
    color = '#000000',
    keyId,
    updateOrgUnitLocation,
    PopupComponent = OrgUnitPopupComponent,
}) => {
    const [currentInstanceId, setCurrentInstanceId] = useState<
        number | undefined
    >();
    const { data: currentInstance, isLoading } =
        useGetInstance(currentInstanceId);
    return (
        <MarkersListComponent
            key={keyId}
            items={locationsList}
            onMarkerClick={i => setCurrentInstanceId(i.id)}
            PopupComponent={PopupComponent}
            popupProps={() => ({
                currentInstance,
                isLoading,
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
