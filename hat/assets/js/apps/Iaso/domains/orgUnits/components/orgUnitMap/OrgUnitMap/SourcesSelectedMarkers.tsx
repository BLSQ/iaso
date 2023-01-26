import React, { FunctionComponent } from 'react';
import { Pane } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { MarkerList } from './MarkersList';
import { colorClusterCustomMarker } from '../../../../../utils/mapUtils';
import { clusterSize, orgunitsPane } from './constants';
import { MappedOrgUnit } from './types';
import { OrgUnit } from '../../../types/orgUnit';

type Props = {
    mappedSourcesSelected: MappedOrgUnit[];
    // eslint-disable-next-line no-unused-vars
    fetchSubOrgUnitDetail: (orgUnit: OrgUnit) => void;
    // eslint-disable-next-line no-unused-vars
    updateOrgUnitLocation: (orgUnit: OrgUnit) => void;
};

export const SourcesSelectedMarkers: FunctionComponent<Props> = ({
    mappedSourcesSelected,
    fetchSubOrgUnitDetail,
    updateOrgUnitLocation,
}) => {
    return (
        <>
            {mappedSourcesSelected.map(s => (
                <MarkerClusterGroup
                    key={s.id}
                    maxClusterRadius={5}
                    iconCreateFunction={cluster =>
                        colorClusterCustomMarker(cluster, s.color, clusterSize)
                    }
                >
                    <Pane
                        name={`${orgunitsPane}-markers-${s.id}`}
                        style={{ zIndex: 698 }}
                    >
                        <MarkerList
                            locationsList={s.orgUnits.locations}
                            fetchDetail={a => fetchSubOrgUnitDetail(a)}
                            color={s.color}
                            keyId={s.id}
                            updateOrgUnitLocation={updateOrgUnitLocation}
                        />
                    </Pane>
                </MarkerClusterGroup>
            ))}
        </>
    );
};
