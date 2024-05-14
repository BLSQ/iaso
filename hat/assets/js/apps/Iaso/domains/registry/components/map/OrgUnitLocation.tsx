import { red } from '@mui/material/colors';
import { useTheme } from '@mui/styles';
import React, { FunctionComponent } from 'react';
import { GeoJSON, Pane } from 'react-leaflet';
import { circleColorMarkerOptions } from '../../../../utils/map/mapUtils';

import CircleMarkerComponent from '../../../../components/maps/markers/CircleMarkerComponent';

import { OrgUnit } from '../../../orgUnits/types/orgUnit';

import { MapToolTip } from './MapTooltip';

type Props = {
    orgUnit: OrgUnit;
    showTooltip: boolean;
    isOrgUnitActive: boolean;
    selectedChildren: OrgUnit | undefined;
};

export const selectedOrgUnitColor = red[500];
export const OrgUnitLocation: FunctionComponent<Props> = ({
    orgUnit,
    showTooltip,
    isOrgUnitActive,
    selectedChildren,
}) => {
    const theme = useTheme();
    return (
        <>
            {isOrgUnitActive && (
                <>
                    {orgUnit.geo_json && (
                        <Pane name="orgunit-shapes" style={{ zIndex: 400 }}>
                            <GeoJSON
                                data={orgUnit.geo_json}
                                style={() => ({
                                    color: !selectedChildren
                                        ? selectedOrgUnitColor
                                        : theme.palette.primary.main,
                                })}
                            >
                                {showTooltip && (
                                    <MapToolTip
                                        permanent
                                        pane="popupPane"
                                        label={orgUnit.name}
                                    />
                                )}
                                {!showTooltip && (
                                    <MapToolTip
                                        pane="popupPane"
                                        label={orgUnit.name}
                                    />
                                )}
                            </GeoJSON>
                        </Pane>
                    )}
                    {orgUnit.latitude && orgUnit.longitude && (
                        <CircleMarkerComponent
                            item={{
                                latitude: orgUnit.latitude,
                                longitude: orgUnit.longitude,
                            }}
                            markerProps={() => ({
                                ...circleColorMarkerOptions(
                                    !selectedChildren
                                        ? selectedOrgUnitColor
                                        : theme.palette.primary.main,
                                ),
                                key: `markers-${orgUnit.id}-${showTooltip}`,
                            })}
                            popupProps={() => ({
                                orgUnit,
                            })}
                            tooltipProps={() => ({
                                permanent: showTooltip,
                                pane: 'popupPane',
                                label: orgUnit.name,
                            })}
                            TooltipComponent={MapToolTip}
                        />
                    )}
                </>
            )}
        </>
    );
};
