import React, { FunctionComponent } from 'react';
import { Pane } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { colorClusterCustomMarker } from '../../../../../utils/map/mapUtils';
import { OrgUnit } from '../../../types/orgUnit';
import { clusterSize } from './constants';
import { MarkerList } from './MarkersList';
import { orgunitsPane } from './OrgUnitMap';
import { MappedOrgUnit } from './types';

type Props = {
    data: MappedOrgUnit[];
    updateOrgUnitLocation: (orgUnit: OrgUnit) => void;
};

export const SelectedMarkers: FunctionComponent<Props> = ({
    data,
    updateOrgUnitLocation,
}) => {
    return (
        <>
            {data.map(mappedOrgUnit => (
                <MarkerClusterGroup
                    key={mappedOrgUnit.id}
                    maxClusterRadius={5}
                    iconCreateFunction={cluster =>
                        colorClusterCustomMarker(
                            cluster,
                            mappedOrgUnit.color,
                            clusterSize,
                        )
                    }
                >
                    <Pane
                        name={`${orgunitsPane}-markers-${mappedOrgUnit.id}-${mappedOrgUnit.name}`}
                        style={{ zIndex: 698 }}
                    >
                        <MarkerList
                            locationsList={mappedOrgUnit.orgUnits.locations}
                            popupProps={o => ({
                                orgUnitId: o.id,
                            })}
                            color={mappedOrgUnit.color}
                            keyId={mappedOrgUnit.id}
                            updateOrgUnitLocation={updateOrgUnitLocation}
                        />
                    </Pane>
                </MarkerClusterGroup>
            ))}
        </>
    );
};
