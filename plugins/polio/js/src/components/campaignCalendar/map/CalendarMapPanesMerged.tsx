import React, { FunctionComponent } from 'react';
import { GeoJSON, Pane } from 'react-leaflet';

import { ViewPort } from '../../../constants/types';
import { CalendarMapTooltip } from './CalendarMapTooltip';
import { getGeoJsonStyle } from './utils';
import { polioVacines } from '../../../constants/virus';

type Props = {
    mergedShapes: any[];
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
                        name={`campaign-${mergedShape.properties.id}`}
                        key={`campaign-${mergedShape.properties.id}`}
                    >
                        <GeoJSON
                            key={mergedShape.properties.id}
                            data={mergedShape}
                            style={() =>
                                getGeoJsonStyle(
                                    polioVacines.find(
                                        v =>
                                            v.value ===
                                            mergedShape.properties.vacine,
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
                                vaccine={mergedShape.properties.vacine}
                            />
                        </GeoJSON>
                    </Pane>
                );
            })}
        </>
    );
};
