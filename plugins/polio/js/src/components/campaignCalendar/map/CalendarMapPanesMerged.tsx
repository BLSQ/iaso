/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import { GeoJSON, Pane } from 'react-leaflet';

import { ViewPort } from '../../../constants/types';
import { CalendarMapTooltip } from './CalendarMapTooltip';
import { getGeoJsonStyle } from './utils';
import { polioVaccines } from '../../../constants/virus';
import { MergedShapeWithColor } from '../types';

type Props = {
    mergedShapes: MergedShapeWithColor[];
    zoom: number;
};

export const CalendarMapPanesMerged: FunctionComponent<Props> = ({
    mergedShapes,
    zoom,
}) => {
    return (
        <Pane name="merged-shapes" key="merged-shapes">
            {mergedShapes?.map(mergedShape => {
                return (
                    <GeoJSON
                        key={`${mergedShape.properties.id}-${mergedShape.cache}`}
                        data={mergedShape}
                        style={() =>
                            getGeoJsonStyle(
                                polioVaccines.find(
                                    v =>
                                        v.value ===
                                        mergedShape.properties.vaccine,
                                )?.color || mergedShape.color,
                                mergedShape.color,
                                zoom,
                            )
                        }
                    >
                        <CalendarMapTooltip
                            type="merged"
                            campaign={mergedShape.properties.obr_name}
                            country={
                                mergedShape.properties.top_level_org_unit_name
                            }
                            vaccine={mergedShape.properties.vaccine}
                        />
                    </GeoJSON>
                );
            })}
        </Pane>
    );
};
