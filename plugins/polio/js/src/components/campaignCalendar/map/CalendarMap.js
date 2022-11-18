import React, {
    useEffect,
    useRef,
    useState,
    useMemo,
    useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { LoadingSpinner } from 'bluesquare-components';
import { Box } from '@material-ui/core';
import { Map, TileLayer } from 'react-leaflet';
import { useQueries } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import moment from 'moment';
import { useGetMergedCampaignShapes } from '../../../hooks/useGetMergedCampaignShapes.ts';
import { MapRoundSelector } from './MapRoundSelector.tsx';
import { VaccinesLegend } from './VaccinesLegend';
import { CampaignsLegend } from './CampaignsLegend';
import { appId } from '../../../constants/app';
import { useStyles } from '../Styles';

import 'leaflet/dist/leaflet.css';
import { CalendarMapPanesRegular } from './CalendarMapPanesRegular.tsx';
import { CalendarMapPanesMerged } from './CalendarMapPanesMerged.tsx';
import { defaultViewport, boundariesZoomLimit } from './constants.ts';
import { polioVaccines } from '../../../constants/virus.ts';
import { deepCopy } from '../../../../../../../hat/assets/js/apps/Iaso/utils/dataManipulation.ts';

const getShapeQuery = (loadingCampaigns, groupId, campaign, vaccine, round) => {
    const baseParams = {
        asLocation: true,
        limit: 3000,
        group: groupId,
        app_id: appId,
    };
    const queryString = new URLSearchParams(baseParams);
    return {
        queryKey: ['campaignShape', baseParams],
        queryFn: () => getRequest(`/api/orgunits/?${queryString.toString()}`),
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

const makeSelections = campaigns => {
    let maxRound = null;
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
    // TODO translate
    const selections = [
        { value: 'all', label: 'All' },
        { value: 'latest', label: 'Latest' },
    ];
    if (showRoundZero) {
        selections.push({ value: 0, label: `Round 0}` });
    }
    for (let i = 1; i <= maxRound; i += 1) {
        selections.push({ value: i, label: `Round ${i}` });
    }
    return selections;
};

const findLatestRounds = (currentDate, campaigns) => {
    const campaignsCopy = deepCopy(campaigns);
    const roundsDict = {};
    campaigns.forEach((c, i) => {
        // What do I do if !rounds?
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
            roundsDict[c.name] = currentRound.number;
            return;
        }
        const nextRound = c.rounds.find(round => {
            const startDate = moment(round.started_at);
            return startDate.isAfter(currentDate);
        });
        if (nextRound) {
            campaignsCopy[i].rounds = [nextRound];
            roundsDict[c.name] = nextRound.number;
            return;
        }
        campaignsCopy[i].rounds = [c.rounds[c.rounds.length - 1]];
        roundsDict[c.name] = c.rounds[c.rounds.length - 1].number;
    });
    return { campaigns: campaignsCopy, roundsDict };
};

const makeQueriesForCampaigns = (campaigns, loadingCampaigns) => {
    const queries = [];
    if (!campaigns || campaigns.length === 0) return queries;
    campaigns.forEach(campaign => {
        if (campaign.separateScopesPerRound) {
            campaign.rounds.forEach(round => {
                round.scopes.forEach(scope => {
                    queries.push(
                        getShapeQuery(
                            loadingCampaigns,
                            scope.group.id,
                            campaign,
                            scope.vaccine,
                            round,
                        ),
                    );
                });
            });
        } else {
            campaign.scopes.forEach(scope => {
                queries.push(
                    getShapeQuery(
                        loadingCampaigns,
                        scope.group.id,
                        campaign,
                        scope.vaccine,
                    ),
                );
            });
        }
    });
    return queries;
};

const findRoundForCampaigns = (campaigns, selection) => {
    const campaignsCopy = deepCopy(campaigns);
    campaigns.forEach((c, i) => {
        campaignsCopy[i].rounds = campaignsCopy[i].rounds.filter(
            r => r.number === selection,
        );
    });
    return campaignsCopy;
};

const makeRoundDict = (selection, campaigns) => {
    const result = {};
    campaigns?.forEach(campaign => {
        result[campaign.name] = selection;
    });
    return result;
};

const useRoundSelection = (selection, campaigns, currentDate) => {
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
        }
        if (selection === 'all') {
            setUpdatedCampaigns(campaigns);
            setRounds({});
        }
        if (typeof selection === 'number') {
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

const useRoundsQueries = (campaigns, loadingCampaigns) => {
    const [queries, setQueries] = useState([]);

    useEffect(() => {
        setQueries(makeQueriesForCampaigns(campaigns, loadingCampaigns));
    }, [campaigns, loadingCampaigns]);

    return queries;
};

// CurrentDate should be today, for map purposes
const CalendarMap = ({ campaigns, loadingCampaigns, isPdf, currentDate }) => {
    const classes = useStyles();
    const [viewport, setViewPort] = useState(defaultViewport);
    const map = useRef();
    const [selection, setSelection] = useState(2);
    const { campaigns: campaignsForMap, roundsDict } = useRoundSelection(
        selection,
        campaigns,
        currentDate,
    );
    console.log(currentDate);
    const queries = useRoundsQueries(campaignsForMap, loadingCampaigns);

    const options = useMemo(() => makeSelections(campaigns), [campaigns]);

    const shapesQueries = useQueries(queries);

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
                ?.filter(
                    shape =>
                        shape.properties.round_number ===
                        roundsDict[shape.properties.obr_name],
                )
                .map(addShapeColor);
        }
        // This will only work if there are separate scopes per round
        if (typeof selection === 'number') {
            return shapesForSelectedCampaign
                ?.filter(shape => shape.properties.round_number === selection)
                .map(addShapeColor);
        }
        return shapesForSelectedCampaign?.map(addShapeColor);
    }, [
        addShapeColor,
        campaignIds,
        mergedShapes?.features,
        roundsDict,
        selection,
    ]);

    const loadingShapes =
        viewport.zoom <= 6
            ? isLoadingMergedShapes
            : shapesQueries.some(q => q.isLoading);

    const campaignsShapes = shapesQueries
        .filter(sq => sq.data)
        .map(sq => sq.data);

    return (
        <Box position="relative">
            {(loadingCampaigns || loadingShapes) && <LoadingSpinner absolute />}
            <div className={classes.mapLegend}>
                <MapRoundSelector
                    selection={selection}
                    options={options}
                    onChange={value => {
                        setSelection(value);
                    }}
                    label="Show round"
                />
                {viewport.zoom > boundariesZoomLimit && (
                    <Box mt={2}>
                        <CampaignsLegend campaigns={campaigns} />
                    </Box>
                )}
                <Box display="flex" justifyContent="flex-end">
                    <VaccinesLegend />
                </Box>
            </div>
            <Map
                zoomSnap={0.25}
                ref={map}
                style={{
                    height: !isPdf ? '72vh' : '800px',
                }}
                center={viewport.center}
                zoom={viewport.zoom}
                scrollWheelZoom={false}
                onViewportChanged={v => setViewPort(v)}
            >
                <TileLayer
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {viewport.zoom > 6 && (
                    <CalendarMapPanesRegular
                        campaignsShapes={campaignsShapes}
                        viewport={viewport}
                    />
                )}
                {viewport.zoom <= 6 && (
                    <CalendarMapPanesMerged
                        mergedShapes={mergedShapesToDisplay}
                        viewport={viewport}
                    />
                )}
            </Map>
        </Box>
    );
};

CalendarMap.defaultProps = {
    isPdf: false,
};

CalendarMap.propTypes = {
    campaigns: PropTypes.array.isRequired,
    loadingCampaigns: PropTypes.bool.isRequired,
    isPdf: PropTypes.bool,
};

export { CalendarMap };
