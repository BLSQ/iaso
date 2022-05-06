import React, { FunctionComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { GeoJSON, Pane, Tooltip } from 'react-leaflet';

import MESSAGES from '../../../constants/messages';
import { ViewPort } from '../../../constants/types';
import { getGeoJsonStyle } from './utils';

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
                                    mergedShape.color,
                                    mergedShape.properties.vacine,
                                    viewport,
                                )
                            }
                        >
                            <Tooltip>
                                <div>
                                    <FormattedMessage {...MESSAGES.campaign} />
                                    {`: ${mergedShape.properties.obr_name}`}
                                </div>
                                <div>
                                    <FormattedMessage {...MESSAGES.country} />
                                    {`: ${mergedShape.properties.top_level_org_unit_name}`}
                                </div>
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
