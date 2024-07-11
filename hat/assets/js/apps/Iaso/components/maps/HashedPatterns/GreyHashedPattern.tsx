import React, { FunctionComponent } from 'react';
import { HashedPattern } from './HashedPattern';

type Props = {
    id: string;
};

export const GreyHashedPattern: FunctionComponent<Props> = ({ id }) => {
    return <HashedPattern id={id} strokeColor="grey" />;
};
