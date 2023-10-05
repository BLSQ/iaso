import { Moment } from 'moment';
import {
    Campaign,
    MergedShape,
    Round,
    Scope,
    Shape,
} from '../../../constants/types';

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
