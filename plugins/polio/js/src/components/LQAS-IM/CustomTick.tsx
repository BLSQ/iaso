import React, { FunctionComponent } from 'react';

export const CustomTick: FunctionComponent<any> = ({ x, y, payload }) => {
    if (typeof payload.value === 'string') {
        const allWords = payload?.value?.split(' ') ?? [];
        const firstWord = allWords.shift();
        const valuesAsWords = [firstWord];
        if (allWords.join(' ').length >= 10) {
            valuesAsWords.push(allWords.shift());
        }
        valuesAsWords.push(allWords.join(' '));
        return (
            <g transform={`translate(${x},${y})`}>
                {valuesAsWords.map((word, index) => (
                    <text
                        key={word + index}
                        x={0}
                        y={15 * index}
                        dy={16}
                        textAnchor="end"
                        fill="#666"
                        transform="rotate(-65)"
                    >
                        {word}
                    </text>
                ))}
            </g>
        );
    }
    return null;
};
