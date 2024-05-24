import React, { FunctionComponent } from 'react';
import { Tooltip } from 'react-leaflet';

type Props = {
    label: string;
    pane: string;
    permanent?: boolean;
};

export const MapToolTip: FunctionComponent<Props> = ({
    label,
    permanent,
    pane,
}) => {
    return (
        <Tooltip
            key={`${label}-${pane}-${permanent}`}
            permanent={permanent}
            pane={pane}
        >
            {label}
        </Tooltip>
    );
};
