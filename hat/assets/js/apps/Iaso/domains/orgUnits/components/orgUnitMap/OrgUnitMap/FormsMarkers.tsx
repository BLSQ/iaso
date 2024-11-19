import React, { FunctionComponent } from 'react';
import { Pane } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { colorClusterCustomMarker } from '../../../../../utils/map/mapUtils';
import { InstancePopup } from '../../../../instances/components/InstancePopUp/InstancePopUp';
import { OrgUnit } from '../../../types/orgUnit';
import { clusterSize, orgunitsPane } from './constants';
import { MarkerList } from './MarkersList';

type Props = {
    forms: any[];
    updateOrgUnitLocation: (orgUnit: OrgUnit) => void;
};

export const FormsMarkers: FunctionComponent<Props> = ({
    forms,
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
                            color={f.color}
                            keyId={f.id}
                            PopupComponent={InstancePopup}
                            popupProps={o => ({
                                instanceId: o.id,
                            })}
                            updateOrgUnitLocation={updateOrgUnitLocation}
                        />
                    </Pane>
                </MarkerClusterGroup>
            ))}
        </>
    );
};
