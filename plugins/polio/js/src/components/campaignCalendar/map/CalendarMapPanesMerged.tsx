/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import { GeoJSON, Pane } from 'react-leaflet';

import { ViewPort } from '../../../constants/types';
import { CalendarMapTooltip } from './CalendarMapTooltip';
import { getGeoJsonStyle } from './utils';
import { polioVaccines } from '../../../constants/virus';

type mergeShape = {
    geom: any;
    color: string;
    properties: {
        scope_key: string;
        id: string; // the campaign id
        vaccine: string;
        top_level_org_unit_name: string;
        obr_name: string;
    };
};

type Props = {
    mergedShapes: mergeShape[];
    viewport: ViewPort;
};

export const CalendarMapPanesMerged: FunctionComponent<Props> = ({
    mergedShapes,
    viewport,
}) => {
    return (
        <>
            {mergedShapes?.map(mergedShape => {
                return (
                    <Pane
                        name={`campaign-${mergedShape.properties.scope_key}`}
                        key={`campaign-${mergedShape.properties.scope_key}`}
                    >
                        <GeoJSON
                            key={mergedShape.properties.id}
                            data={mergedShape}
                            style={() =>
                                getGeoJsonStyle(
                                    polioVaccines.find(
                                        v =>
                                            v.value ===
                                            mergedShape.properties.vaccine,
                                    )?.color || mergedShape.color,
                                    mergedShape.color,
                                    viewport,
                                )
                            }
                        >
                            <CalendarMapTooltip
                                type="merged"
                                campaign={mergedShape.properties.obr_name}
                                country={
                                    mergedShape.properties
                                        .top_level_org_unit_name
                                }
                                vaccine={mergedShape.properties.vaccine}
                            />
                        </GeoJSON>
                    </Pane>
                );
            })}
        </>
    );
};
