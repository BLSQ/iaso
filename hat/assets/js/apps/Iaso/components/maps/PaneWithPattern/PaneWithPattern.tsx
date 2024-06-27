import React, { FunctionComponent, ReactElement } from 'react';
import { Pane } from 'react-leaflet';

type Props = {
    name: string;
    patterns?: any[];
    patternIds?: string[];
    children: ReactElement;
};

/**
 *
 * @param name - Unique name that will be passed down to the underlying `Pane`component
 * @param patterns - patterns to be used as shape background. Requires matching `patternIds`.See `GreyHashedPattern` for an example of acceptable pattern component
 * @param patternIds - array of ids to be passed to the `patterns`. Both arrays should be of matching length or the patterns won't be rendered.
 *
 *
 * A wrapper for react-leaflet `Pane` component. If passed `patterns` and `patternId` it will enabled using these patterns
 * as background for shapes passed e.g to a child `GeoJson` component. Passing patterns and patternIDs separately enables storing the ids in constants
 * and using a style function to conditionally use patterns as background
 *
 * @returns
 */
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
