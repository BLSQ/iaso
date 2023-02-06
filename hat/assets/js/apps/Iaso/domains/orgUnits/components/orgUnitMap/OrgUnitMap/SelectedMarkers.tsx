import React, { FunctionComponent } from 'react';
import { Pane } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { colorClusterCustomMarker } from '../../../../../utils/mapUtils';
import { OrgUnit } from '../../../types/orgUnit';
import { clusterSize } from './constants';
import { MarkerList } from './MarkersList';
import { orgunitsPane } from './OrgUnitMap';
import { MappedOrgUnit } from './types';

type Props = {
    data: MappedOrgUnit[];
    // eslint-disable-next-line no-unused-vars
    fetchSubOrgUnitDetail: (orgUnit: OrgUnit) => void;
    // eslint-disable-next-line no-unused-vars
    updateOrgUnitLocation: (orgUnit: OrgUnit) => void;
};

export const SelectedMarkers: FunctionComponent<Props> = ({
    data,
    fetchSubOrgUnitDetail,
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
                            fetchDetail={a => fetchSubOrgUnitDetail(a)}
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
