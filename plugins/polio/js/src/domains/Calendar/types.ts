import { ReactElement } from 'react';
import { Campaign } from '../../constants/types';

export type Field = {
    width?: number;
    key: string;
    hideHeadTitle?: boolean;
    // eslint-disable-next-line no-unused-vars
    render?: (campaign: Campaign) => ReactElement | string;
    exportHide?: boolean;
    sortKey?: string;
};
