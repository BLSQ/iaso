import React, { FunctionComponent } from 'react';
import { HashedPattern } from './HashedPattern';

type Props = {
    id: string;
    strokeColor: string;
    fillColor: string;
};

export const ColorsHashedPattern: FunctionComponent<Props> = ({
    id,
    strokeColor,
    fillColor,
}) => {
    return (
        <HashedPattern
            id={id}
            strokeColor={strokeColor}
            fillColor={fillColor}
        />
    );
};
