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
            {campaignsShapes.map(campaignShape => {
                const { id, name, country, color } = campaignShape.campaign;
                const paneName = `campaign-${id}-vaccine-${
                    campaignShape.vaccines
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
                                        campaignShape.color || color,
                                        color,
                                        viewport,
                                    )
                                }
                            >
                                <CalendarMapTooltip
                                    type="regular"
                                    campaign={name}
                                    country={country}
                                    region={findRegion(shape, regions)}
                                    district={shape.name}
                                    vaccine={campaignShape.vaccine}
                                    // vaccines={original.vaccines}
                                />
                            </GeoJSON>
                        ))}
                    </Pane>
                );
            })}
        </>
    );
};
