import { Paginated, UrlParams } from 'bluesquare-components';
import { NameAndId } from 'Iaso/types/utils';

export type PromptnessStatus = 'ON_TIME' | 'LATE' | 'MISSING';

export type PromptnessRouterParams = UrlParams & {
    accountId?: string;
    formId?: string;
    period?: string;
    parentId?: string;
    orgUnitId?: string;
    orgUnitTypeIds?: string;
    status?: string;
};

export type PromptnessCounts = {
    is_applicable: boolean;
    expected: number | null;
    received: number | null;
    completeness_percent: number | null;
    on_time: number | null;
    on_time_percent: number | null;
    late: number | null;
    late_percent: number | null;
    missing: number | null;
    missing_percent: number | null;
};

export type PromptnessRow = PromptnessCounts & {
    id: number;
    name: string;
    org_unit_type_id: number | null;
    parent_org_unit: NameAndId | null;
    has_children: boolean;
};

export type PromptnessStatsApiResponse = Paginated<PromptnessRow>;

export type PromptnessPeriod = {
    value: string;
    start: string;
    end: string;
    grace_period_days: number;
    deadline: string;
    is_current: boolean;
    is_provisional: boolean;
};

export type PromptnessSummary = {
    period: PromptnessPeriod;
    totals: PromptnessCounts;
};
