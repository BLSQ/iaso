import React, { FunctionComponent } from 'react';
import { Pane } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { colorClusterCustomMarker } from '../../../../../utils/map/mapUtils';
import { InstancePopup } from '../../../../instances/components/InstancePopUp/InstancePopUp';
import { Instance } from '../../../../instances/types/instance';
import { OrgUnit } from '../../../types/orgUnit';
import { clusterSize, orgunitsPane } from './constants';
import { MarkerList } from './MarkersList';

type Props = {
    forms: any[];
    fetchInstanceDetail: (instance: Instance) => void;
    updateOrgUnitLocation: (orgUnit: OrgUnit) => void;
};

export const FormsMarkers: FunctionComponent<Props> = ({
    forms,
    fetchInstanceDetail,
    updateOrgUnitLocation,
}) => {
    return (
        <>
            {forms.map(f => (
                <MarkerClusterGroup
                    key={f.id}
                    maxClusterRadius={5}
                    iconCreateFunction={cluster =>
                        colorClusterCustomMarker(cluster, f.color, clusterSize)
                    }
                >
                    <Pane
                        name={`${orgunitsPane}-markers-${f.id}`}
                        style={{ zIndex: 698 }}
                    >
                        <MarkerList
                            locationsList={f.instances}
                            fetchDetail={a => fetchInstanceDetail(a)}
                            color={f.color}
                            keyId={f.id}
                            // The underlying Marker components are all js components, Ts compiler infers a lot and sees errors
                            // @ts-ignore
                            PopupComponent={InstancePopup}
                            updateOrgUnitLocation={updateOrgUnitLocation}
                        />
                    </Pane>
                </MarkerClusterGroup>
            ))}
        </>
    );
};
