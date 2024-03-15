/* eslint-disable camelcase */
import { Campaign, CampaignListItem, Round } from '../constants/types';
import { accessArrayRound } from '../domains/LQAS-IM/shared/LqasIm';

type Shape = {
    id: string;
};

type Data = {
    [key: string]: any;
};

type LegendItem = {
    label: string;
    value: string;
    color: string;
};

export const findDataForShape = ({
    shape,
    data,
    round,
    campaign,
}: {
    shape: Shape;
    data: Data;
    round: number;
    campaign: string;
}): any | null => {
    if (!data || !data[campaign]) return null;
    const dataForRound = accessArrayRound(data[campaign], round);
    const result = dataForRound.filter((d: any) => d.district === shape.id)[0];
    return result;
};

export const sortCampaignNames = (
    nameA: { label: string } | undefined,
    nameB: { label: string } | undefined,
): number => {
    const [countryCodeA, referenceA] = nameA?.label.split('-') || ['', ''];
    const [countryCodeB, referenceB] = nameB?.label.split('-') || ['', ''];
    const comparison = countryCodeA.localeCompare(countryCodeB, undefined, {
        sensitivity: 'accent',
    });
    if (comparison === 0) {
        const refA = parseInt(referenceA, 10);
        const refB = parseInt(referenceB, 10);
        if (refA < refB) return -1;
        if (refA > refB) return 1;
        return 0;
    }
    return comparison;
};

export const makeCampaignsDropDown = (
    campaigns: Campaign[] | undefined,
): { label: string; value: string }[] =>
    campaigns
        ?.map(campaign => ({
            label: campaign.obr_name,
            value: campaign.obr_name,
        }))
        .sort(sortCampaignNames) ?? [];

export const makeCampaignsDropDownWithUUID = (
    campaigns: Campaign[] | undefined,
): { label: string; value: string }[] => {
    return (
        campaigns
            ?.map(campaign => ({
                label: campaign.obr_name,
                value: campaign.id,
            }))
            .sort(sortCampaignNames) ?? []
    );
};

export const defaultShapeStyle: { [key: string]: string | number } = {
    color: 'grey',
    opacity: '1',
    fillColor: 'lightGrey',
    weight: '1',
    zIndex: 1,
};

export const getScopeStyle = (
    shape: Shape,
    scope: Shape[],
): { [key: string]: string | number } => {
    const isShapeInScope =
        scope.filter(shapeInScope => shape.id === shapeInScope.id).length === 1;
    if (isShapeInScope) {
        return {
            color: 'grey',
            opacity: '1',
            fillColor: 'grey',
            weight: '2',
            zIndex: 1,
        };
    }
    return defaultShapeStyle;
};

export const findScopeIds = (
    obrName: string | undefined,
    campaigns: Campaign[],
    currentRound: number,
): string[] => {
    let scopeIds = obrName
        ? campaigns.filter(campaign => campaign.obr_name === obrName)
        : campaigns;

    scopeIds = scopeIds
        .map(campaign => {
            if (!campaign.separate_scopes_per_round) {
                return campaign.scopes
                    ?.filter(scope => scope.group)
                    .map(scope => scope.group!.org_units)
                    .flat();
            }
            const fullRound = campaign.rounds?.find(
                round => round.number === currentRound,
            );
            if (fullRound) {
                return fullRound.scopes
                    ?.filter(scope => scope.group)
                    .map(scope => scope.group!.org_units)
                    .flat();
            }
            return [];
        })
        .flat();
    return scopeIds;
};

export const makeLegendItem = ({
    label,
    value,
    color,
}: LegendItem): LegendItem => {
    return {
        label: `${label}: ${value}`,
        value: `${label}: ${value}`,
        color,
    };
};

export const convertWidth = (
    width: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string,
): string => {
    if (width === 'xs') return '100px';
    if (width === 'sm') return '120px';
    if (width === 'md') return '150px';
    if (width === 'lg') return '180px';
    if (width === 'xl') return '200px';
    return '100px';
};

export const floatToPercentString = (num: number): string => {
    if (Number.isSafeInteger(num)) return `${parseInt(num.toString(), 10)}%`;
    return `${Math.round(num)}%`;
};

export const convertObjectToString = (value: { [key: string]: any }): string =>
    Object.entries(value)
        .map(([key, entry]) => `${key}-${String(entry)}`)
        .toString();

export const findCampaignRound = (
    campaign: { rounds: Round[] },
    round: number,
): Round | undefined => {
    return campaign.rounds.find(rnd => rnd.number === round);
};

export const isPolioCampaign = (
    campaign: Campaign | CampaignListItem,
): boolean => {
    return campaign.campaign_types.some(
        type => type.name.toLowerCase() === 'polio',
    );
};
