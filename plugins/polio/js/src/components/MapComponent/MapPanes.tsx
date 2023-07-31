import React, { FunctionComponent, ReactNode } from 'react';
import { GeoJSON, Tooltip, Pane } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { get } from 'lodash';
import { MapColor, Shape } from '../../constants/types';
import { findBackgroundShape } from './utils';

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
                    mainLayer?.map(shape => (
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
                            {/* @ts-ignore */}
                            <Tooltip title={shape.name} pane="popupPane">
                                {(backgroundLayer?.length ?? 0) > 0 && (
                                    <span>
                                        {tooltipLabels &&
                                            `${
                                                tooltipLabels.background
                                            }: ${findBackgroundShape(
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
                                        `${tooltipLabels.main}: ${get(
                                            shape,
                                            tooltipFieldKey,
                                        )}`}
                                    {!tooltipLabels &&
                                        `${get(shape, tooltipFieldKey)}`}
                                </span>
                            </Tooltip>
                        </GeoJSON>
                    ))}
            </Pane>
        </>
    );
};
