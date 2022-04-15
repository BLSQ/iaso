import React, { FunctionComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { GeoJSON, Pane, Tooltip } from 'react-leaflet';
import { findRegion } from '../../../utils';
import MESSAGES from '../../../constants/messages';
import { vaccineOpacity } from '../Styles';
import { boundariesZoomLimit } from './constants';

type ViewPort = {
    zoom: number;
    center: number[];
};

type Props = {
    campaignsShapes: any[];
    viewport: ViewPort;
    regions: { id: number; name: string }[];
};

const getGeoJsonStyle = (cs, viewport) => {
    return {
        color: cs.campaign.color,
        fillOpacity: vaccineOpacity,
        fillColor: cs.vacine?.color,
        weight: viewport.zoom > boundariesZoomLimit ? 2 : 0,
    };
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
                                style={() => getGeoJsonStyle(cs, viewport)}
                            >
                                <Tooltip>
                                    <div>
                                        <FormattedMessage
                                            {...MESSAGES.campaign}
                                        />
                                        {`: ${cs.campaign.name}`}
                                    </div>
                                    <div>
                                        <FormattedMessage
                                            {...MESSAGES.country}
                                        />
                                        {`: ${cs.campaign.country}`}
                                    </div>
                                    <div>
                                        <FormattedMessage
                                            {...MESSAGES.region}
                                        />
                                        {`: ${findRegion(shape, regions)}`}
                                    </div>
                                    <div>
                                        <FormattedMessage
                                            {...MESSAGES.district}
                                        />
                                        {`: ${shape.name}`}
                                    </div>
                                    <div>
                                        <FormattedMessage
                                            {...MESSAGES.vaccine}
                                        />
                                        {`: ${cs.vacine?.label}`}
                                    </div>
                                </Tooltip>
                            </GeoJSON>
                        ))}
                    </Pane>
                );
            })}
        </>
    );
};
