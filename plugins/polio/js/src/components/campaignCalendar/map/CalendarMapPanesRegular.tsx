import React, { FunctionComponent } from 'react';
import { GeoJSON, Pane } from 'react-leaflet';
import { findRegion } from '../../../utils';
import { ViewPort } from '../../../constants/types';
import { getGeoJsonStyle } from './utils';
import { CalendarMapTooltip } from './CalendarMapTooltip';

type Props = {
    campaignsShapes: any[];
    viewport: ViewPort;
    regions: { id: number; name: string }[];
};

export const CalendarMapPanesRegular: FunctionComponent<Props> = ({
    campaignsShapes,
    viewport,
    regions,
}) => {
    return (
        <>
            {campaignsShapes.map(cs => {
                return (
                    <Pane
                        name={`campaign-${cs.campaign.id}`}
                        key={cs.campaign.id}
                    >
                        {cs.shapes.map(shape => (
                            <GeoJSON
                                key={shape.id}
                                data={shape.geo_json}
                                style={() =>
                                    getGeoJsonStyle(
                                        cs.campaign.color,
                                        cs.campaign.original.vacine,
                                        viewport,
                                    )
                                }
                            >
                                <CalendarMapTooltip
                                    type="regular"
                                    campaign={cs.campaign.name}
                                    country={cs.campaign.country}
                                    region={findRegion(shape, regions)}
                                    district={shape.name}
                                    vaccine={cs.campaign.original.vacine}
                                />
                            </GeoJSON>
                        ))}
                    </Pane>
                );
            })}
        </>
    );
};
