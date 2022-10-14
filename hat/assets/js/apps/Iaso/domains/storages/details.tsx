import React, { FunctionComponent } from 'react';
import { StorageDetailsParams } from './types/storages';

type Props = {
    params: StorageDetailsParams;
};
export const Details: FunctionComponent<Props> = ({ params }) => {
    console.log('params', params);
    return <>DETAILS</>;
};
