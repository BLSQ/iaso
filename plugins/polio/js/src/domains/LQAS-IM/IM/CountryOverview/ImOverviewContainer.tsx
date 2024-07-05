import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';

import { Paper, Divider, Box, Tabs, Tab } from '@mui/material';
import {
    commonStyles,
    useRedirectToReplace,
    useSafeIntl,
} from 'bluesquare-components';
import { makeStyles } from '@mui/styles';
import { baseUrls } from '../../../../constants/urls';
import { ImCountryMap } from './ImCountryMap';
import { LqasImMapHeader } from '../../shared/Map/LqasImMapHeader';
import {
    Campaign,
    ConvertedLqasImData,
    IMType,
    Side,
    Sides,
} from '../../../../constants/types';
import { DropdownOptions } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { determineLqasImDates } from '../../shared/utils';
import { LIST, MAP } from '../../shared/constants';
import { ImSummary } from './ImSummary';
import MESSAGES from '../../../../constants/messages';
import { useGetGeoJson } from '../../../Campaigns/Scope/hooks/useGetGeoJson';
import { getLqasImMapLayer } from '../utils';
import { ImCountryListOverview } from './ImCountryListOverview';

const defaultShapes = [];
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

type Props = {
    round: number;
    campaign: string;
    campaigns: Array<unknown>;
    country: string;
    data: Record<string, ConvertedLqasImData>;
    isFetching: boolean;
    debugData: Record<string, unknown> | null | undefined;
    paperElevation: number;
    type: IMType;
    options: DropdownOptions<number>[];
    // eslint-disable-next-line no-unused-vars
    onRoundChange: (value: number) => void;
    side: Side;
    params: Record<string, string | undefined>;
};

export const ImOverviewContainer: FunctionComponent<Props> = ({
    round,
    campaign,
    campaigns,
    country,
    data,
    isFetching,
    debugData,
    paperElevation,
    type,
    options,
    onRoundChange,
    side,
    params,
}) => {
    const baseUrl = baseUrls[type];
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const redirectToReplace = useRedirectToReplace();
    const campaignObject = useMemo(
        () =>
            campaigns.filter(
                (c: Record<string, unknown>) => c.obr_name === campaign,
            )[0] as Campaign,
        [campaign, campaigns],
    );
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
            type,
            campaigns,
            round,
            shapes,
        });
    }, [shapes, data, campaign, type, round, campaigns]);

    const { start: startDate, end: endDate } = useMemo(
        () => determineLqasImDates(campaignObject, round, type),
        [campaignObject, round, type],
    );

    const paramTab = side === Sides.left ? params.leftTab : params.rightTab;

    const [tab, setTab] = useState(paramTab ?? MAP);

    // TABS
    const handleChangeTab = useCallback(
        newtab => {
            const tabKey = side === Sides.left ? 'leftTab' : 'rightTab';
            setTab(newtab);
            const newParams = {
                ...params,
                [tabKey]: newtab,
            };
            redirectToReplace(baseUrl, newParams);
        },
        [side, params, redirectToReplace, baseUrl],
    );
    // TABS

    return (
        <Paper elevation={paperElevation}>
            <Box mb={2}>
                <LqasImMapHeader
                    round={round}
                    startDate={startDate}
                    endDate={endDate}
                    options={options}
                    onRoundSelect={onRoundChange}
                    campaignObrName={campaign}
                    isFetching={isFetching}
                />
            </Box>
            <Divider />
            <ImSummary
                round={round}
                campaign={campaign}
                data={data}
                type={type}
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
                <ImCountryMap
                    round={round}
                    selectedCampaign={campaign}
                    type={type}
                    countryId={parseInt(country, 10)}
                    campaigns={campaigns}
                    data={data}
                    isFetching={isFetching}
                    disclaimerData={debugData}
                    mainLayer={mainLayer}
                    isFetchingGeoJson={isFetchingGeoJson}
                    regionShapes={regionShapes}
                    isFetchingRegions={isFetchingRegions}
                />
            )}
            {tab === LIST && (
                <ImCountryListOverview
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
