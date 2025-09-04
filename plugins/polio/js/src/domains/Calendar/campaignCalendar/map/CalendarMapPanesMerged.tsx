import React, { FunctionComponent } from 'react';
import { GeoJSON, Pane } from 'react-leaflet';

import { GeoJson } from '../../../../constants/types';
import {
    OTHER_VACCINE_COLOR,
    polioVaccines,
} from '../../../../constants/virus';
import { MergedShapeWithCacheDate } from '../types';
import { CalendarMapTooltip } from './CalendarMapTooltip';
import { getGeoJsonStyle } from './utils';

type Props = {
    mergedShapes: MergedShapeWithCacheDate[];
    zoom: number;
};

export const CalendarMapPanesMerged: FunctionComponent<Props> = ({
    mergedShapes,
    zoom,
}) => {
    return (
        <Pane name="merged-shapes" key="merged-shapes">
            {mergedShapes?.map(mergedShape => {
                const color = mergedShape.properties.color;
                return (
                    <GeoJSON
                        key={`${mergedShape.properties.id}-${mergedShape.properties.round_number}-${mergedShape.properties.vaccine}-${mergedShape.cache}`}
                        data={mergedShape as unknown as GeoJson}
                        style={() => getGeoJsonStyle(color, color, zoom)}
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
