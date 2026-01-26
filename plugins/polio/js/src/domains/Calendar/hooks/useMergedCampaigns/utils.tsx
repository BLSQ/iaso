import moment from 'moment';
import { CalendarCampaign, UuidAsString } from '../../../../constants/types';
import {
    CalendarOrdering,
    IntegratedCampaignAPIResponse,
} from '../../campaignCalendar/types';

// TODO update TS type for additional fields
export const addLayoutInfo = (list: CalendarCampaign[]): CalendarCampaign[] => {
    // campaign +1 integrated = min length of 2
    if (list.length === 2) {
        return [
            { ...list[0], layout: 'top' },
            { ...list[1], layout: 'bottom' },
        ];
    }
    if (list.length > 2) {
        const copy: CalendarCampaign[] = [...list];
        const first: CalendarCampaign = copy.shift() as CalendarCampaign;
        const last: CalendarCampaign = copy.pop() as CalendarCampaign;
        return [
            { ...first, layout: 'top' },
            ...copy.map((el: CalendarCampaign) => ({
                ...el,
                layout: 'middle' as 'top' | 'middle' | 'bottom', // the TS compiler is being weird so we need to cast the type
            })),
            { ...last, layout: 'bottom' },
        ];
    }
    // default fallback, to avoid errors
    return list;
};

export const consolidateCampaigns = (
    integratedCampaigns: IntegratedCampaignAPIResponse[],
    regularCampaigns: CalendarCampaign[],
): CalendarCampaign[] => {
    if (integratedCampaigns.length === 0) {
        return [...regularCampaigns];
    }
    const idsDict: Record<UuidAsString, any[]> = {};
    integratedCampaigns.forEach(ic => {
        if (idsDict[ic.integrated_to]) {
            idsDict[ic.integrated_to].push(ic);
        } else {
            idsDict[ic.integrated_to] = [ic];
        }
    });
    const result: CalendarCampaign[] = [];
    regularCampaigns.forEach(cc => {
        if (idsDict[cc.id]) {
            const withIntegrated = [cc, ...idsDict[cc.id]];
            result.push(...addLayoutInfo(withIntegrated));
        } else {
            result.push(cc);
        }
    });
    return result;
};

export const sortCampaigns = <
    T extends CalendarCampaign | IntegratedCampaignAPIResponse,
>(
    campaigns: T[],
    order: CalendarOrdering,
): T[] => {
    switch (order) {
        case '-first_round_started_at':
            return campaigns.sort(
                (campA, campB) =>
                    moment(campA.first_round_started_at).date() -
                    moment(campB.first_round_started_at).date(),
            );
        case 'first_round_started_at':
            return campaigns.sort(
                (campA, campB) =>
                    moment(campB.first_round_started_at).date() -
                    moment(campA.first_round_started_at).date(),
            );
        case '-country__name':
            return campaigns.sort((campA, campB) =>
                campA.top_level_org_unit_name.localeCompare(
                    campB.top_level_org_unit_name,
                    undefined,
                    {
                        sensitivity: 'accent',
                    },
                ),
            );
        case 'country__name':
            return campaigns.sort((campA, campB) =>
                campB.top_level_org_unit_name.localeCompare(
                    campA.top_level_org_unit_name,
                    undefined,
                    {
                        sensitivity: 'accent',
                    },
                ),
            );
        case '-obr_name':
            return campaigns.sort((campA, campB) =>
                campA.obr_name.localeCompare(campB.obr_name, undefined, {
                    sensitivity: 'accent',
                }),
            );
        case 'obr_name':
            return campaigns.sort((campA, campB) =>
                campB.obr_name.localeCompare(campA.obr_name, undefined, {
                    sensitivity: 'accent',
                }),
            );
        default:
            return campaigns;
    }
};
