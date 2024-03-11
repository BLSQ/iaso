import { Moment } from 'moment';
import {
    Campaign,
    MergedShape,
    Round,
    Scope,
    Shape,
} from '../../../constants/types';
import { CampaignType } from '../../Campaigns/hooks/api/useGetCampaigns';

export type Query = {
    queryKey: any[];
    queryFn: CallableFunction;
    select: CallableFunction;
    enabled: boolean;
};

export type MergedShapeWithCacheDate = MergedShape & { cache: number };

export type MergedShapeWithColor = MergedShapeWithCacheDate & { color: string };

export type CalendarRound = Round & {
    weeksCount: number;
    start: Moment;
    end: Moment;
};

export type MappedCampaign = {
    original: Campaign;
    name: string;
    rounds: CalendarRound[];
    scopes: Scope[];
    separateScopesPerRound: boolean;
    color: string;
    country: string;
    // eslint-disable-next-line camelcase
    country_id: number;
    id: string;
    isPreventive: boolean;
};

export type ShapeForCalendarMap = {
    color: string;
    campaign: MappedCampaign;
    round?: any;
    vaccine: string;
    shapes: Shape[];
};

export type CalendarParams = {
    roundStartFrom?: string;
    roundStartTo?: string;
    showOnlyDeleted?: string;
    // eslint-disable-next-line camelcase
    show_test?: string;
    filterLaunched?: string;
    order?: string;
    countries?: string[];
    search?: string;
    campaignType?: CampaignType;
    campaignGroups?: string;
    orgUnitGroups?: string;
    currentDate?: string;
};

export type CalendarData = {
    headers: {
        years: { value: string; daysCount: number }[];
        months: { year: string; value: string; daysCount: number }[];
        weeks: {
            year: string;
            month: string;
            value: string;
            monday: Moment;
        }[];
    };
    currentWeekIndex: number;
    firstMonday: Moment;
    lastSunday: Moment;
};

export type WeekHeader = {
    year: string;
    month: string;
    value: string;
    monday: Moment;
};
export type YearHeader = {
    value: string;
    daysCount: number;
};
