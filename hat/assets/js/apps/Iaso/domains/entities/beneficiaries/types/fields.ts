import { FieldType } from '../../../forms/types/forms';

export type Field = {
    label: string;
    value?: string | number;
    key?: string;
    type?: FieldType;
};

export type Column = {
    name: string;
    type: FieldType;
    label: string;
};
