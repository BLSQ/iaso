import React, { FunctionComponent } from 'react';

type Props = {
    id: string;
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    angle?: number;
};
/**
 *
 * @param id - a CSS id (without the `#`)
 * @param strokeColor - stripe color. defaults to black
 * @param fillColor - background color, effectively a second stroke color. Defaults to white
 * @param strokeWidth - number. Defaults to 20
 * @param angle - the angle of the stripes. Defaults to 45
 * @returns
 */
export const HashedPattern: FunctionComponent<Props> = ({
    id,
    fillColor = 'white',
    strokeColor = 'black',
    strokeWidth = 20,
    angle = 45,
}) => {
    return (
        <pattern
            id={id}
            width={`${strokeWidth}`}
            height={`${strokeWidth}`}
            patternTransform={`rotate(${angle} 0 0)`}
            patternUnits="userSpaceOnUse"
        >
            <rect
                x="0"
                y="0"
                width={`${strokeWidth}`}
                height={`${strokeWidth}`}
                style={{ fill: fillColor }}
            />
            <line
                x1="0"
                y1="0"
                x2="0"
                y2={`${strokeWidth}`}
                style={{
                    stroke: strokeColor,
                    strokeWidth,
                }}
            />
        </pattern>
    );
};
