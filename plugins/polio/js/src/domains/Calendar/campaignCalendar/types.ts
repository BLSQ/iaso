import { Moment } from 'moment';
import { User } from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import {
    CalendarCampaign,
    MergedShape,
    Scope,
    Shape,
} from '../../../constants/types';
import { CampaignCategory } from '../../Campaigns/hooks/api/useGetCampaigns';

export type Query = {
    queryKey: (string | Record<string, unknown>)[];
    queryFn: CallableFunction;
    select: CallableFunction;
    enabled: boolean;
};

export type MergedShapeWithCacheDate = MergedShape & { cache: number };

export type CalendarRound = {
    end?: Moment;
    number: number;
    start?: Moment;
    id?: number;
    started_at?: string;
    ended_at?: string;
    daysCount?: number;
    weeksCount?: number;
    vaccine_names: string;
    scopes: Scope[];
    target_population: number;
    hasSubActivities: boolean;
};

export type MappedCampaign = {
    original: CalendarCampaign;
    name: string;
    rounds: CalendarRound[];
    scopes: Scope[];
    separateScopesPerRound: boolean;
    color?: string;
    country: string;
    // eslint-disable-next-line camelcase
    country_id: number;
    id: string;
    isPreventive: boolean;
    isTest: boolean;
    onHold: boolean;
};

export type ShapeForCalendarMap = {
    color: string;
    campaign: MappedCampaign;
    round?: CalendarRound;
    vaccine: string;
    shapes: Shape[];
};

export type CalendarParams = {
    accountId?: string; // unused but automatically added to the url
    roundStartFrom?: string;
    roundStartTo?: string;
    showOnlyDeleted?: string;
    // eslint-disable-next-line camelcase
    show_test?: string; // boolean in string form
    on_hold?: string; // boolean in string form
    filterLaunched?: string;
    order?: string;
    countries?: string;
    search?: string;
    campaignType?: string;
    campaignCategory?: CampaignCategory;
    campaignGroups?: string;
    orgUnitGroups?: string;
    currentDate?: string;
    periodType?: PeriodType;
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
export type MonthHeader = {
    year: string;
    value: string;
    daysCount: number;
};

export type Users = {
    current: User;
};

export type PeriodType = 'quarter' | 'year' | 'semester';
