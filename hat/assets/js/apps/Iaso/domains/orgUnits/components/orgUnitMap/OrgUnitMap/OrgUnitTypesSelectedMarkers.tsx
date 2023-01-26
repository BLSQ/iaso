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
    mappedOrgUnitTypesSelected: MappedOrgUnit[];
    // eslint-disable-next-line no-unused-vars
    fetchSubOrgUnitDetail: (orgUnit: OrgUnit) => void;
    // eslint-disable-next-line no-unused-vars
    updateOrgUnitLocation: (orgUnit: OrgUnit) => void;
};

export const OrgUnitTypesSelectedMarkers: FunctionComponent<Props> = ({
    mappedOrgUnitTypesSelected,
    fetchSubOrgUnitDetail,
    updateOrgUnitLocation,
}) => {
    return (
        <>
            {mappedOrgUnitTypesSelected.map(ot => (
                <MarkerClusterGroup
                    key={ot.id}
                    maxClusterRadius={5}
                    iconCreateFunction={cluster =>
                        colorClusterCustomMarker(cluster, ot.color, clusterSize)
                    }
                >
                    <Pane
                        name={`${orgunitsPane}-markers-${ot.id}-${ot.name}`}
                        style={{ zIndex: 698 }}
                    >
                        <MarkerList
                            locationsList={ot.orgUnits.locations}
                            fetchDetail={a => fetchSubOrgUnitDetail(a)}
                            color={ot.color}
                            keyId={ot.id}
                            updateOrgUnitLocation={updateOrgUnitLocation}
                        />
                    </Pane>
                </MarkerClusterGroup>
            ))}
        </>
    );
};
