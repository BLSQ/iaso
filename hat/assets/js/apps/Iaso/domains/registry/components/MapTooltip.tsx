import React, { FunctionComponent } from 'react';
import { Tooltip } from 'react-leaflet';

type Props = {
    label: string;
    pane: string;
    permanent: boolean;
};

export const MapToolTip: FunctionComponent<Props> = ({
    label,
    permanent,
    pane,
}) => {
    return (
        <>
            {/* @ts-ignore TODO: fix this type problem */}
            <Tooltip permanent={permanent} pane={pane}>
                {label}
            </Tooltip>
        </>
    );
};
