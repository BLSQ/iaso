import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';

import { Paper, Divider, Tab, Tabs, makeStyles } from '@material-ui/core';

import { useDispatch } from 'react-redux';
import { commonStyles, useSafeIntl } from 'bluesquare-components';

import { LqasSummary } from './LqasSummary';
import { LqasImMapHeader } from '../../shared/LqasImMapHeader';
import {
    Campaign,
    ConvertedLqasImData,
    Side,
    Sides,
} from '../../../../constants/types';

import { DropdownOptions } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { Router } from '../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { LQAS_BASE_URL } from '../../../../constants/routes';
import { redirectToReplace } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/actions';
import MESSAGES from '../../../../constants/messages';
import { computeScopeCounts, determineLqasImDates } from '../../shared/utils';
import { LIST, LqasIMView, MAP } from '../../shared/constants';
import { LqasCountryListOverview } from './LqasCountryListOverview';
import { useGetGeoJson } from '../../../Campaigns/Scope/hooks/useGetGeoJson';
import { getLqasImMapLayer } from '../../IM/utils';
import { LqasCountryMap } from './LqasCountryMap';

const defaultShapes = [];
type Props = {
    round: number;
    campaign: string;
    campaigns: Array<unknown>;
    country: string;
    data: Record<string, ConvertedLqasImData>;
    isFetching: boolean;
    debugData: Record<string, unknown> | null | undefined;
    paperElevation: number;
    options: DropdownOptions<number>[];
    // eslint-disable-next-line no-unused-vars
    onRoundChange: (value: number) => void;
    side: Side;
    router: Router;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    mapContainer: {
        '& .tile-switch-control': {
            top: 'auto',
            bottom: theme.spacing(1),
            left: theme.spacing(1),
            right: 'auto',
        },
    },
    // We need to render the map to have bounds. Otherwise the API call for districts will get a 500
    hidden: { visibility: 'hidden', height: 0 },
}));

export const LqasOverviewContainer: FunctionComponent<Props> = ({
    round,
    campaign,
    campaigns,
    country,
    data,
    isFetching,
    debugData,
    paperElevation,
    options,
    onRoundChange,
    side,
    router,
}) => {
    const dispatch = useDispatch();
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const campaignObject = campaigns.filter(
        (c: Record<string, unknown>) => c.obr_name === campaign,
    )[0] as Campaign;
    const countryId = parseInt(country, 10);
    const { data: shapes = defaultShapes, isFetching: isFetchingGeoJson } =
        useGetGeoJson(countryId, 'DISTRICT');

    const {
        data: regionShapes = defaultShapes,
        isFetching: isFetchingRegions,
    } = useGetGeoJson(countryId, 'REGION');

    const mainLayer = useMemo(() => {
        return getLqasImMapLayer({
            data,
            selectedCampaign: campaign,
            type: LqasIMView.lqas,
            campaigns,
            round,
            shapes,
        });
    }, [data, campaign, campaigns, round, shapes]);

    const { start: startDate, end: endDate } = determineLqasImDates(
        campaignObject,
        round,
        LqasIMView.lqas,
    );
    const paramTab =
        side === Sides.left ? router.params.leftTab : router.params.rightTab;

    const [tab, setTab] = useState(paramTab ?? MAP);

    // TABS
    const handleChangeTab = useCallback(
        newtab => {
            const tabKey = side === Sides.left ? 'leftTab' : 'rightTab';
            setTab(newtab);
            const newParams = {
                ...router.params,
                [tabKey]: newtab,
            };
            dispatch(redirectToReplace(`${LQAS_BASE_URL}/lqas`, newParams));
        },
        [router.params, dispatch, side],
    );
    // TABS

    const scopeCount = computeScopeCounts(campaignObject, round);
    return (
        <Paper elevation={paperElevation}>
            <LqasImMapHeader
                round={round}
                startDate={startDate}
                endDate={endDate}
                options={options ?? []}
                onRoundSelect={onRoundChange}
                campaignObrName={campaign}
                isFetching={isFetching}
            />
            <Divider />
            <LqasSummary
                round={round}
                campaign={campaign}
                data={data}
                scopeCount={scopeCount}
            />
            <Divider />
            <Tabs
                value={tab}
                classes={{
                    root: classes.tabs,
                }}
                className={classes.marginBottom}
                indicatorColor="primary"
                onChange={(event, newtab) => handleChangeTab(newtab)}
            >
                <Tab value={MAP} label={formatMessage(MESSAGES.map)} />
                <Tab value={LIST} label={formatMessage(MESSAGES.list)} />
            </Tabs>
            {tab === MAP && (
                <LqasCountryMap
                    round={round}
                    selectedCampaign={campaign}
                    type={LqasIMView.lqas}
                    countryId={countryId}
                    campaigns={campaigns}
                    data={data}
                    isFetching={isFetching}
                    isFetchingGeoJson={isFetchingGeoJson}
                    disclaimerData={debugData}
                    mainLayer={mainLayer}
                    regionShapes={regionShapes}
                    isFetchingRegions={isFetchingRegions}
                />
            )}
            {tab === LIST && (
                <LqasCountryListOverview
                    shapes={mainLayer}
                    regionShapes={regionShapes}
                    isFetching={
                        isFetching || isFetchingGeoJson || isFetchingRegions
                    }
                />
            )}
        </Paper>
    );
};
