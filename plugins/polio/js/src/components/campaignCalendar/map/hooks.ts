import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGetMergedCampaignShapes } from '../../../hooks/useGetMergedCampaignShapes';
import {
    findLatestRounds,
    findRoundForCampaigns,
    makeQueriesForCampaigns,
    makeRoundDict,
} from './utils';

export const useRoundSelection = (selection, campaigns, currentDate) => {
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

    // console.log('updatedCampaigns', updatedCampaigns, selection, rounds);

    return {
        campaigns: updatedCampaigns,
        roundsDict: rounds,
    };
};

export const useRoundsQueries = (campaigns, loadingCampaigns): any[] => {
    const [queries, setQueries] = useState<any[]>([]);

    useEffect(() => {
        setQueries(makeQueriesForCampaigns(campaigns, loadingCampaigns));
    }, [campaigns, loadingCampaigns]);

    return queries;
};

export const useMergedShapes = ({
    campaigns,
    roundsDict,
    selection,
    firstAndLastRounds,
}) => {
    const { data: mergedShapes, isLoading: isLoadingMergedShapes } =
        useGetMergedCampaignShapes().query;

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
    const mergedShapesToDisplay = useMemo(() => {
        const shapesForSelectedCampaign = mergedShapes?.features.filter(shape =>
            campaignIds.includes(shape.properties.id),
        );
        if (selection === 'all') {
            return shapesForSelectedCampaign?.map(addShapeColor);
        }

        // This will only work if there are separate scopes per round
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
        // This will only work if there are separate scopes per round
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
        mergedShapes?.features,
        roundsDict,
        selection,
    ]);
    return useMemo(() => {
        return { mergedShapes: mergedShapesToDisplay, isLoadingMergedShapes };
    }, [isLoadingMergedShapes, mergedShapesToDisplay]);
};
