import React, { FunctionComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { GeoJSON, Pane, Tooltip } from 'react-leaflet';

import MESSAGES from '../../../constants/messages';
import { vaccineOpacity } from '../Styles';
import { polioVacines } from '../../../constants/virus';
import { boundariesZoomLimit } from './constants';

type ViewPort = {
    zoom: number;
    center: number[];
};

type Props = {
    mergedShapes: any[];
    viewport: ViewPort;
};

const getGeoJsonStyle = (shape, viewport) => {
    return {
        color: shape.color,
        fillOpacity: vaccineOpacity,
        fillColor: polioVacines.find(v => v.value === shape.properties.vacine)
            ?.color,
        weight: viewport.zoom > boundariesZoomLimit ? 2 : 0,
    };
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
                            style={() => getGeoJsonStyle(mergedShape, viewport)}
                        >
                            <Tooltip>
                                <div>
                                    <FormattedMessage {...MESSAGES.campaign} />
                                    {`: ${mergedShape.properties.name}`}
                                </div>
                                <div>
                                    <FormattedMessage {...MESSAGES.country} />
                                    {`: ${mergedShape.properties.country}`}
                                </div>
                                {/* <div>
                                    <FormattedMessage {...MESSAGES.region} />
                                    {`: ${findRegion(shape, regions)}`}
                                </div> */}
                                {/* <div>
                                    <FormattedMessage {...MESSAGES.district} />
                                    {`: ${shape.name}`}
                                </div> */}
                                <div>
                                    <FormattedMessage {...MESSAGES.vaccine} />
                                    {`: ${mergedShape.properties.vacine}`}
                                </div>
                            </Tooltip>
                        </GeoJSON>
                    </Pane>
                );
            })}
        </>
    );
};
