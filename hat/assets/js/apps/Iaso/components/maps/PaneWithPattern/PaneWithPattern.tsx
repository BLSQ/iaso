import React, { FunctionComponent, ReactElement } from 'react';
import { Pane } from 'react-leaflet';

type Props = {
    name: string;
    patterns?: any[];
    patternIds?: string[];
    children: ReactElement;
};

export const PaneWithPattern: FunctionComponent<Props> = ({
    name,
    patterns = [],
    patternIds = [],
    children,
}) => {
    const patternsCount = patterns.length;
    const patternIdsCount = patternIds.length;
    const hasPatterns = patternsCount > 0 && patternIdsCount > 0;
    const hasPatternIdsError = patternsCount !== patternIdsCount;
    if (hasPatternIdsError && patternsCount > patternIdsCount) {
        console.warn(`Missing ${patternsCount - patternIdsCount} pattern ids`);
    }
    if (hasPatternIdsError && patternsCount < patternIdsCount) {
        console.warn(
            `${patternIdsCount - patternsCount} ids too many for pattern count`,
        );
    }
    return (
        <Pane name={name}>
            {hasPatterns && !hasPatternIdsError && (
                <svg>
                    <defs>
                        {patterns.map((Pattern, index) => {
                            return <Pattern id={patternIds[index]} />;
                        })}
                    </defs>
                </svg>
            )}
            {children}
        </Pane>
    );
};
