import React, { FunctionComponent } from 'react';
import { GeoJSON, Pane } from 'react-leaflet';
import { ShapeForCalendarMap } from '../types';
import { CalendarMapTooltip } from './CalendarMapTooltip';
import { getGeoJsonStyle } from './utils';

type Props = {
    campaignsShapes: ShapeForCalendarMap[];
    zoom: number;
};

export const CalendarMapPanesRegular: FunctionComponent<Props> = ({
    campaignsShapes,
    zoom,
}) => {
    return (
        <>
            {campaignsShapes.map(campaignShape => {
                const { id, name, country, color } = campaignShape.campaign;
                const paneName = `campaign-${id}-vaccine-${
                    campaignShape.vaccine
                }${
                    campaignShape.round ? `round-${campaignShape.round.id}` : ''
                }`;
                return (
                    <Pane name={paneName} key={paneName}>
                        {campaignShape.shapes.map(shape => (
                            <GeoJSON
                                key={shape.id}
                                data={shape.geo_json}
                                style={() =>
                                    getGeoJsonStyle(
                                        campaignShape.color,
                                        color || campaignShape.color,
                                        zoom,
                                    )
                                }
                            >
                                <CalendarMapTooltip
                                    type="regular"
                                    campaign={name}
                                    country={country}
                                    region={shape.parent_name}
                                    district={shape.name}
                                    vaccine={campaignShape.vaccine}
                                />
                            </GeoJSON>
                        ))}
                    </Pane>
                );
            })}
        </>
    );
};
