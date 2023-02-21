import React, { FunctionComponent } from 'react';
import { Pane } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { clusterSize, orgunitsPane } from './constants';
import { colorClusterCustomMarker } from '../../../../../utils/mapUtils';
import { MarkerList } from './MarkersList';
import { InstancePopup } from '../../../../instances/components/InstancePopUp/InstancePopUp';
import { OrgUnit } from '../../../types/orgUnit';
import { Instance } from '../../../../instances/types/instance';

type Props = {
    forms: any[];
    // eslint-disable-next-line no-unused-vars
    fetchInstanceDetail: (instance: Instance) => void;
    // eslint-disable-next-line no-unused-vars
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
