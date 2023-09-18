import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// @ts-ignore
import moment, { Moment } from 'moment';
import { useQueries, Query as RQQuery } from 'react-query';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { useGetMergedCampaignShapes } from '../../hooks/useGetMergedCampaignShapes';
import {
    findFirstAndLastRounds,
    findLatestRounds,
    findRoundForCampaigns,
    makeQueriesForCampaigns,
    makeRoundDict,
} from './utils';
import MESSAGES from '../../../../constants/messages';
import {
    MappedCampaign,
    MergedShapeWithColor,
    Query,
    ShapeForCalendarMap,
} from '../types';
import { MergedShapes } from '../../../../constants/types';

type RoundSelection = {
    campaigns: MappedCampaign[];
    roundsDict: Record<string, string>;
};

export const useRoundSelection = (
    selection: string,
    campaigns: MappedCampaign[],
    currentDate: Moment,
): RoundSelection => {
    const [updatedCampaigns, setUpdatedCampaigns] = useState(campaigns);
    const [rounds, setRounds] = useState({});

    useEffect(() => {
        if (selection === 'latest') {
            const { campaigns: newCampaigns, roundsDict } = findLatestRounds(
                currentDate,
                campaigns,
            );
            setUpdatedCampaigns(newCampaigns);
            setRounds(roundsDict);
        } else if (selection === 'all') {
            setUpdatedCampaigns(campaigns);
            setRounds({});
        } else {
            setUpdatedCampaigns(findRoundForCampaigns(campaigns, selection));
            setRounds(makeRoundDict(selection, campaigns));
        }
    }, [campaigns, currentDate, selection]);

    return {
        campaigns: updatedCampaigns,
        roundsDict: rounds,
    };
};

export const useRoundsQueries = (
    campaigns: MappedCampaign[],
    loadingCampaigns: boolean,
): Query[] => {
    const [queries, setQueries] = useState<Query[]>([]);

    useEffect(() => {
        setQueries(makeQueriesForCampaigns(campaigns, loadingCampaigns));
    }, [campaigns, loadingCampaigns]);

    return queries;
};

type UseMergedShapesArgs = {
    campaigns: MappedCampaign[];
    roundsDict: Record<string, string>;
    selection: string;
};

type UseMergedShapesResult = {
    mergedShapes: MergedShapeWithColor[];
    isLoadingMergedShapes: boolean;
};

type UseGetMergedShapesResult = {
    data: MergedShapes;
    isFetching: boolean;
};

export const useMergedShapes = ({
    campaigns,
    roundsDict,
    selection,
}: UseMergedShapesArgs): UseMergedShapesResult => {
    const { data: mergedShapes, isFetching: isLoadingMergedShapes } =
        useGetMergedCampaignShapes() as UseGetMergedShapesResult;

    const firstAndLastRounds = useMemo(() => {
        return findFirstAndLastRounds(campaigns);
    }, [campaigns]);

    const campaignColors = useMemo(() => {
        const color = {};
        campaigns.forEach(campaign => {
            color[campaign.id] = campaign.color;
        });
        return color;
    }, [campaigns]);

    const campaignIds = useMemo(
        () => campaigns.map(campaign => campaign.id),
        [campaigns],
    );

    const addShapeColor = useCallback(
        shape => {
            return { ...shape, color: campaignColors[shape.properties.id] };
        },
        [campaignColors],
    );
    const mergedShapesToDisplay: MergedShapeWithColor[] = useMemo(() => {
        const shapesForSelectedCampaign = (mergedShapes?.features ?? [])
            .filter(shape => campaignIds.includes(shape.properties.id))
            .map(shape => {
                return {
                    ...shape,
                    cache: mergedShapes?.cache_creation_date ?? 0,
                };
            });
        if (selection === 'all') {
            return shapesForSelectedCampaign?.map(addShapeColor);
        }

        if (selection === 'latest') {
            return shapesForSelectedCampaign
                ?.filter(shape => {
                    return (
                        `${shape.properties.round_number}` ===
                            roundsDict[shape.properties.id] ||
                        !shape.properties.round_number
                    );
                })
                .map(addShapeColor);
        }
        return shapesForSelectedCampaign
            ?.filter(shape => {
                if (shape.properties.round_number) {
                    return `${shape.properties.round_number}` === selection;
                }
                if (firstAndLastRounds[shape.properties.id]) {
                    return (
                        firstAndLastRounds[shape.properties.id].firstRound <=
                            parseInt(selection, 10) &&
                        parseInt(selection, 10) <=
                            firstAndLastRounds[shape.properties.id].lastRound
                    );
                }
                return false;
            })
            .map(addShapeColor);
    }, [
        addShapeColor,
        campaignIds,
        firstAndLastRounds,
        mergedShapes?.cache_creation_date,
        mergedShapes?.features,
        roundsDict,
        selection,
    ]);
    return useMemo(() => {
        return { mergedShapes: mergedShapesToDisplay, isLoadingMergedShapes };
    }, [isLoadingMergedShapes, mergedShapesToDisplay]);
};

type UseShapesResult = {
    isLoadingShapes: boolean;
    roundsDict: Record<string, string>;
    shapes: ShapeForCalendarMap[];
};

export const useShapes = (
    selection: string,
    campaigns: MappedCampaign[],
    loadingCampaigns: boolean,
): UseShapesResult => {
    // storing the date in a ref to avoid an infinite loop.
    const today = useRef(moment());
    const { campaigns: campaignsForMap, roundsDict } = useRoundSelection(
        selection,
        campaigns,
        today.current,
    );
    const queries = useRoundsQueries(campaignsForMap, loadingCampaigns);
    const shapesQueries = useQueries(queries as unknown as RQQuery[]);
    const campaignsShapes: ShapeForCalendarMap[] = useMemo(
        () =>
            shapesQueries
                .filter(sq => sq.data)
                .map(sq => sq.data as ShapeForCalendarMap),
        [shapesQueries],
    );
    const isLoadingShapes = shapesQueries.some(q => q.isLoading);

    return useMemo(
        () => ({ isLoadingShapes, shapes: campaignsShapes, roundsDict }),
        [campaignsShapes, isLoadingShapes, roundsDict],
    );
};

export const useIconLabel = (selection: string): string => {
    const { formatMessage } = useSafeIntl();
    const [label, setLabel] = useState<string>('');

    useEffect(() => {
        const parsed = parseInt(selection, 10);
        if (!Number.isNaN(parsed)) {
            setLabel(`${formatMessage(MESSAGES.round)} ${parsed}`);
        } else if (selection === 'all' || selection === 'latest') {
            setLabel(formatMessage(MESSAGES[selection]));
        } else {
            console.warn(`Incorrect selection value: ${selection}`);
            setLabel(formatMessage(MESSAGES.unknown));
        }
    }, [formatMessage, selection]);

    return label;
};
