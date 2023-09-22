import moment, { Moment } from 'moment';
import { cloneDeep } from 'lodash';
import { vaccineOpacity } from '../Styles';
import { boundariesZoomLimit } from './constants';
import { polioVaccines } from '../../../../constants/virus';
import { appId } from '../../../../constants/app';
import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { MappedCampaign, Query } from '../types';
import {
    DropdownOptions,
    Nullable,
} from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';

export const getGeoJsonStyle = (
    fillColor: string,
    color: string,
    zoom: number,
): Record<string, string | number | undefined> => {
    return {
        color,
        fillOpacity: vaccineOpacity,
        fillColor,
        weight: zoom > boundariesZoomLimit ? 2 : 0,
    };
};

type ShapeQueryArgs = {
    loadingCampaigns: boolean;
    groupId: any;
    campaign: any;
    vaccine: any;
    round?: any;
};

export const getShapeQuery = ({
    loadingCampaigns,
    groupId,
    campaign,
    vaccine,
    round,
}: ShapeQueryArgs): Query => {
    const baseParams = {
        asLocation: 'true',
        limit: '3000',
        group: groupId,
        app_id: appId,
    };
    const query = new URLSearchParams(baseParams);
    return {
        queryKey: ['campaignShape', baseParams],
        queryFn: () => getRequest(`/api/orgunits/?${query.toString()}`),
        select: data => ({
            campaign,
            shapes: data,
            vaccine,
            color: polioVaccines.find(v => v.value === vaccine)?.color,
            round,
        }),
        enabled: !loadingCampaigns,
    };
};

export const makeSelections = (
    campaigns: MappedCampaign[],
): DropdownOptions<string>[] => {
    let maxRound: Nullable<number> = null;
    let showRoundZero = false;
    campaigns.forEach(campaign => {
        const lastRound = campaign.rounds[campaign.rounds.length - 1];
        const { number } = lastRound ?? {};

        if (
            Number.isInteger(number) &&
            (!maxRound || (maxRound && number > maxRound))
        ) {
            maxRound = number;
        }

        if (number === 0) {
            showRoundZero = true;
        }
    });
    const selections = [
        { value: 'all', label: 'All' },
        { value: 'latest', label: 'Latest' },
    ];
    if (showRoundZero) {
        selections.push({ value: '0', label: `Round 0` });
    }
    if (maxRound) {
        for (let i = 1; i <= maxRound; i += 1) {
            selections.push({ value: `${i}`, label: `Round ${i}` });
        }
    }
    return selections;
};

type LatestRoundsResult = {
    roundsDict: Record<string, string>;
    campaigns: MappedCampaign[];
};

export const findLatestRounds = (
    currentDate: Moment,
    campaigns: MappedCampaign[],
): LatestRoundsResult => {
    const campaignsCopy = cloneDeep(campaigns);
    const roundsDict = {};
    campaigns.forEach((c, i) => {
        const currentRound = c.rounds.find(round => {
            const startDate = moment(round.started_at);
            const endDate = moment(round.ended_at); // TODO handle rounds with no end date
            return (
                startDate.isSameOrBefore(currentDate) &&
                endDate.isSameOrAfter(currentDate)
            );
        });
        if (currentRound) {
            campaignsCopy[i].rounds = [currentRound];
            roundsDict[c.id] = `${currentRound.number}`;
            return;
        }
        const nextRound = c.rounds.find(round => {
            const startDate = moment(round.started_at);
            return startDate.isAfter(currentDate);
        });
        if (nextRound) {
            campaignsCopy[i].rounds = [nextRound];
            roundsDict[c.id] = `${nextRound.number}`;
            return;
        }
        campaignsCopy[i].rounds = [c.rounds[c.rounds.length - 1]];
        roundsDict[c.id] = `${c.rounds[c.rounds.length - 1].number}`;
    });
    return { campaigns: campaignsCopy, roundsDict };
};

export const makeQueriesForCampaigns = (
    campaigns: MappedCampaign[],
    loadingCampaigns: boolean,
): Query[] => {
    const queries = [];
    if (!campaigns || campaigns.length === 0) return queries;
    campaigns.forEach(campaign => {
        if (campaign.separateScopesPerRound) {
            campaign.rounds.forEach(round => {
                round.scopes.forEach((scope: any) => {
                    queries.push(
                        getShapeQuery({
                            loadingCampaigns,
                            groupId: scope.group.id,
                            campaign,
                            vaccine: scope.vaccine,
                            round,
                        }) as never,
                    );
                });
            });
        } else if (campaign.rounds.length > 0) {
            campaign.scopes.forEach(scope => {
                queries.push(
                    getShapeQuery({
                        loadingCampaigns,
                        groupId: scope.group.id,
                        campaign,
                        vaccine: scope.vaccine,
                    }) as never,
                );
            });
        }
    });
    return queries;
};

export const findRoundForCampaigns = (
    campaigns: MappedCampaign[],
    selection: string,
): MappedCampaign[] => {
    const campaignsCopy = cloneDeep(campaigns);
    campaigns.forEach((c, i) => {
        campaignsCopy[i].rounds = campaignsCopy[i].rounds.filter(
            r => r.number === parseInt(selection, 10),
        );
    });
    return campaignsCopy;
};

export const makeRoundDict = (
    selection: string,
    campaigns: MappedCampaign[],
): Record<string, string> => {
    const result = {};
    campaigns?.forEach(campaign => {
        result[campaign.id] = selection;
    });
    return result;
};

type FirstAndLastRounds = {
    firstRound: number;
    lastRound: number;
};

export const findFirstAndLastRounds = (
    campaigns: MappedCampaign[],
): Record<string, FirstAndLastRounds> => {
    const result = {};
    campaigns.forEach(campaign => {
        const lastRound = campaign.rounds[campaign.rounds.length - 1].number;
        // Getting the first round in case there's a round 0
        const firstRound = campaign.rounds[0].number;
        result[campaign.id] = { firstRound, lastRound };
    });
    return result;
};
