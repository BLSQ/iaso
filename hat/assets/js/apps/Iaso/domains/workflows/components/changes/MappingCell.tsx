import React, { FunctionComponent } from 'react';

type Props = {
    mapping?: Record<string, string>;
};

export const MappingCell: FunctionComponent<Props> = ({ mapping }) => {
    return (
        <>
            {mapping &&
                Object.entries(mapping)
                    .map(([mapKey, mapValue]) => `${mapKey} => ${mapValue}`)
                    .join(', ')}
        </>
    );
};
