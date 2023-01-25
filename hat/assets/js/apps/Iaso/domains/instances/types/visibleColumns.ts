import { ReactElement } from 'react';

export type VisibleColumn = {
    active: boolean;
    disabled: boolean;
    key: string;
    label: string | ReactElement;
    meta?: boolean;
};
