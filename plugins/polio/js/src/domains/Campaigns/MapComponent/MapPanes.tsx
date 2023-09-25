import React, { FunctionComponent, ReactNode } from 'react';
import { GeoJSON, Pane } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapColor, Shape } from '../../../constants/types';

import { Tooltip } from './Tooltip';

type Props = {
    mainLayer?: Shape[];
    backgroundLayer?: Shape[];
    // eslint-disable-next-line no-unused-vars
    getMainLayerStyle?: (shape: Shape) => MapColor;
    // eslint-disable-next-line no-unused-vars
    getBackgroundLayerStyle?: (shape: Shape) => MapColor;
    tooltipLabels?: { main: string; background: string };
    name?: string;
    // eslint-disable-next-line no-unused-vars
    makePopup?: (shape: Shape) => ReactNode;
    // eslint-disable-next-line no-unused-vars
    onSelectShape?: (shape: Shape) => void;
    tooltipFieldKey?: string;
    // eslint-disable-next-line no-unused-vars
    customTooltip?: (shape: Shape) => ReactNode;
};

export const MapPanes: FunctionComponent<Props> = ({
    mainLayer,
    backgroundLayer,
    getMainLayerStyle = () => null,
    getBackgroundLayerStyle = () => null,
    tooltipLabels,
    name = 'Map',
    makePopup,
    onSelectShape = () => null,
    tooltipFieldKey = 'name',
    customTooltip,
}) => {
    return (
        <>
            <Pane name={`BackgroundLayer-${name}`}>
                {(backgroundLayer?.length ?? 0) > 0 &&
                    backgroundLayer?.map(shape => (
                        <GeoJSON
                            key={shape.id}
                            data={shape.geo_json}
                            // @ts-ignore
                            style={() => getBackgroundLayerStyle(shape)}
                            onClick={() => null}
                        />
                    ))}
            </Pane>
            <Pane name={`MainLayer-${name}`}>
                {(mainLayer?.length ?? 0) > 0 &&
                    mainLayer?.map(shape => {
                        return (
                            <GeoJSON
                                // TODO better parametrize this
                                key={
                                    // @ts-ignore
                                    shape?.status
                                        ? // @ts-ignore
                                          `${shape.status}-${shape.id}`
                                        : shape.id
                                }
                                data={shape.geo_json}
                                // @ts-ignore
                                style={() => getMainLayerStyle(shape)}
                                onClick={() => onSelectShape(shape)}
                            >
                                {makePopup && makePopup(shape)}
                                {!customTooltip && (
                                    <Tooltip
                                        backgroundLayer={backgroundLayer}
                                        shape={shape}
                                        tooltipFieldKey={tooltipFieldKey}
                                        tooltipLabels={tooltipLabels}
                                    />
                                )}
                                {customTooltip && customTooltip(shape)}
                            </GeoJSON>
                        );
                    })}
            </Pane>
        </>
    );
};
