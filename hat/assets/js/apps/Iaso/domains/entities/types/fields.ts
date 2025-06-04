import React from 'react';
import { FieldType } from '../../forms/types/forms';

export type Field = {
    value: string | number | React.ReactNode;
    label: string;
    type?: string;
    key: string;
};

export type ExtraColumn = {
    name: string;
    type: FieldType;
    label: string;
};
