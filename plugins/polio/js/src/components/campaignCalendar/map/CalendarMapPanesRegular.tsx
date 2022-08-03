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
                const {
                    separateScopesPerRound,
                    id,
                    name,
                    country,
                    original,
                    color,
                } = campaignShape.campaign;

                console.log('original', original);
                return (
                    <Pane name={`campaign-${id}`} key={id}>
                        {separateScopesPerRound &&
                            campaignShape.campaign.rounds.map(round => {
                                return round.scopes.map(scope => {
                                    return scope.group.org_units.map(
                                        orgUnit => {
                                            const currentShape =
                                                campaignShape.shapes.find(
                                                    shape =>
                                                        shape.id === orgUnit,
                                                );
                                            if (currentShape) {
                                                return (
                                                    <GeoJSON
                                                        key={currentShape.id}
                                                        data={
                                                            currentShape.geo_json
                                                        }
                                                        style={() =>
                                                            getGeoJsonStyle(
                                                                color,
                                                                scope.vaccine,
                                                                viewport,
                                                            )
                                                        }
                                                    >
                                                        <CalendarMapTooltip
                                                            type="regular"
                                                            campaign={name}
                                                            country={country}
                                                            region={findRegion(
                                                                currentShape,
                                                                regions,
                                                            )}
                                                            district={
                                                                currentShape.name
                                                            }
                                                            vaccine={
                                                                scope.vaccine
                                                            }
                                                        />
                                                    </GeoJSON>
                                                );
                                            }
                                            return null;
                                        },
                                    );
                                });
                            })}
                        {!separateScopesPerRound &&
                            campaignShape.shapes.map(shape => (
                                <GeoJSON
                                    key={shape.id}
                                    data={shape.geo_json}
                                    style={() =>
                                        getGeoJsonStyle(
                                            color,
                                            original.vacine,
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
                                        vaccine={original.vacine}
                                    />
                                </GeoJSON>
                            ))}
                    </Pane>
                );
            })}
        </>
    );
};
