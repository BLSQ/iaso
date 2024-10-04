import { ReactElement } from 'react';
import { MappedCampaign } from './campaignCalendar/types';

export type Field = {
    width?: number;
    key: string;
    hideHeadTitle?: boolean;
    render?: (campaign: MappedCampaign) => ReactElement | string;
    exportHide?: boolean;
    sortKey?: string;
};
