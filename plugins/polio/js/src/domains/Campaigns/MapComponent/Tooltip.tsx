import React, { FunctionComponent } from 'react';
import { Tooltip as LeafletTooltip } from 'react-leaflet';
import { get } from 'lodash';

import { Shape } from '../../../constants/types';
import { findBackgroundShape } from './utils';

type Props = {
    backgroundLayer?: Shape[];
    tooltipLabels?: { main: string; background: string };
    shape: Shape;
    tooltipFieldKey?: string;
};

export const Tooltip: FunctionComponent<Props> = ({
    backgroundLayer,
    tooltipLabels,
    shape,
    tooltipFieldKey = 'name',
}) => {
    return (
        // @ts-ignore
        <LeafletTooltip title={shape.name} pane="popupPane">
            {(backgroundLayer?.length ?? 0) > 0 && (
                <span>
                    {tooltipLabels &&
                        `${tooltipLabels.background}: ${findBackgroundShape(
                            shape,
                            // backgroundLayer cannot be undefined because this code will only run if it is not.
                            // @ts-ignore
                            backgroundLayer,
                        )} > `}
                    {/* {!tooltipLabels &&
                                                `${get(shape, tooltipFieldKey)}`} */}
                </span>
            )}
            <span>
                {tooltipLabels &&
                    `${tooltipLabels.main}: ${get(shape, tooltipFieldKey)}`}
                {!tooltipLabels && `${get(shape, tooltipFieldKey)}`}
            </span>
        </LeafletTooltip>
    );
};
