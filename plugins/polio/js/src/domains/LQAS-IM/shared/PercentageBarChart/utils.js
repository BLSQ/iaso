import React from 'react';
import { Typography, Box } from '@material-ui/core';
import { BAR_HEIGHT } from './constants';

export const determineColor = (data, palette, treshold) => {
    const valueAsFloat = parseFloat(data.value);
    if (valueAsFloat >= treshold.ok) return palette.ok;
    if (valueAsFloat >= treshold.warning) return palette.warning;
    return palette.fail;
};

export const customLabel = ({ x, y, width, height, value }) => {
    const labelPosition = value > 20 ? x : x + width;
    const alignment = value > 20 ? 'end' : 'start';
    const color = 'white';
    // using BAR_HEIGHT here is arbitrary. We just need a value that ensures all text can be displayed, as small widths will crop
    const adjustedWidth = width > 55 ? width : 55;
    return (
        <g>
            <foreignObject
                x={labelPosition}
                y={y}
                width={adjustedWidth}
                height={height}
            >
                <Box
                    alignContent="start"
                    alignItems="center"
                    justifyContent={alignment}
                    height={BAR_HEIGHT}
                    width={width}
                    display="flex"
                    ml={1}
                    mr={1}
                    pr={2}
                    style={{ color, textShadow: '1px 1px 2px black' }}
                >
                    <Typography>{`${value}%`}</Typography>
                </Box>
            </foreignObject>
        </g>
    );
};

export const customLabelHorizontal = ({ x, y, value, width }) => {
    const color = 'white';
    const height = 50;
    const theWidth = 80;
    return (
        <g>
            <foreignObject
                x={x - (theWidth - width) / 2}
                y={y - height + 2}
                width={theWidth}
                height={height}
            >
                <Box
                    alignContent="start"
                    alignItems="center"
                    justifyContent="center"
                    height={height}
                    width={theWidth}
                    display="flex"
                    style={{ color, textShadow: '1px 1px 2px black' }}
                >
                    <Typography>{`${Math.round(value)}%`}</Typography>
                </Box>
            </foreignObject>
        </g>
    );
};
