/* eslint-disable camelcase */
import React, { FunctionComponent, useCallback } from 'react';
import { GeoJSON, Pane } from 'react-leaflet';

import {
    polioVaccines,
    useOtherVaccineColor,
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
    const otherVaccineColor = useOtherVaccineColor();

    const getColor = useCallback(
        (vaccine: string | undefined) => {
            const vaccineColor = polioVaccines.find(
                v => v.value === vaccine,
            )?.color;
            return vaccineColor || otherVaccineColor;
        },
        [otherVaccineColor],
    );

    return (
        <Pane name="merged-shapes" key="merged-shapes">
            {mergedShapes?.map(mergedShape => {
                const color = getColor(mergedShape.properties.vaccine);
                return (
                    <GeoJSON
                        key={`${mergedShape.properties.id}-${mergedShape.properties.round_number}-${mergedShape.properties.vaccine}-${mergedShape.cache}`}
                        data={mergedShape}
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
