import React, { FunctionComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { GeoJSON, Pane, Tooltip } from 'react-leaflet';
import { findRegion } from '../../../utils';
import MESSAGES from '../../../constants/messages';
import { ViewPort } from '../../../constants/types';
import { getGeoJsonStyle } from './utils';

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
                                        {`: ${cs.campaign.original.vacine}`}
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
