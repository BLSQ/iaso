import { useEffect, useState } from 'react';
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
