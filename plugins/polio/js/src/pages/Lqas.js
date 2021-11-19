import React, { useState, useCallback } from 'react';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { useSafeIntl, Select } from 'bluesquare-components';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { getRequest } from 'Iaso/libs/Api';
import { Grid, Box } from '@material-ui/core';
import MESSAGES from '../constants/messages';
import { useGetGeoJson } from '../hooks/useGetGeoJson';
import { useGetCampaigns } from '../hooks/useGetCampaigns';
import { MapComponent } from '../components/MapComponent/MapComponent';

const NIGER_POC_URL = '/api/polio/imstats/?country=niger-im';
const NIGER_ORG_UNIT_ID = 29709;
const LQAS_STRICT_PASS = 'lqasStrictOK';
const LQAS_STRICT_FAIL = 'lqasStrictFail';
const LQAS_LAX_PASS = 'lqasLaxOk';
const LQAS_LAX_FAIL = 'lqasLaxFail';

const districtColors = {
    [LQAS_STRICT_PASS]: {
        color: 'lime',
        weight: '1',
        opacity: '1',
        zIndex: '1',
    },
    [LQAS_STRICT_FAIL]: {
        color: 'red',
        weight: '1',
        opacity: '1',
        zIndex: '1',
    },
    [LQAS_LAX_PASS]: {
        color: 'blue',
        weight: '1',
        opacity: '1',
        zIndex: '1',
    },
    [LQAS_LAX_FAIL]: {
        color: 'gray',
        weight: '1',
        opacity: '1',
        zIndex: '1',
    },
};

const getLQAS = async () => getRequest(NIGER_POC_URL);

const useLQAS = campaign => {
    return useSnackQuery(['LQAS', getLQAS, campaign], getLQAS, undefined, {
        select: data => {
            if (!campaign) return data;
            return { ...data, stats: { [campaign]: data.stats[campaign] } };
        },
    });
};

const findLQASDataForShape = (shapeName, LQASData, round) => {
    if (!LQASData) return null;
    const { stats } = LQASData;
    const campaigns = Object.keys(stats);
    const result = campaigns
        .filter(campaign => stats[campaign][round][shapeName] !== undefined)
        .map(campaign => stats[campaign][round][shapeName] !== undefined);
    if (result.length > 0)
        throw new Error(`Found more than 1 round for ${shapeName}`);
    return result[0];
};

const laxLQASPass = (checked, marked) => {
    return Math.floor(60 * (marked / checked)) === 57;
};

const determineStatusForDistrict = district => {
    if (!district) return null;
    const { total_child_fmd: marked, total_child_checked: checked } = district;
    if (checked === 60) {
        if (marked === 60) return LQAS_STRICT_PASS;
        return LQAS_STRICT_FAIL;
    }
    if (laxLQASPass(checked, marked)) {
        return LQAS_LAX_PASS;
    }
    return LQAS_LAX_FAIL;
};

const makeCampaignsDropDown = campaigns =>
    campaigns.map(campaign => {
        return {
            label: campaign.obr_name,
            value: campaign.obr_name,
        };
    });

export const Lqas = () => {
    const { formatMessage } = useSafeIntl();
    const [campaign, setCampaign] = useState();
    const { data: LQASData, isLoading } = useLQAS(campaign);
    const { data: shapes } = useGetGeoJson(NIGER_ORG_UNIT_ID, 'DISTRICT');
    const { data: campaigns = [], isLoading: campaignsLoading } =
        useGetCampaigns({
            countries: NIGER_ORG_UNIT_ID.toString(),
        }).query;
    console.log('LQASData', LQASData);
    console.log('shapes', shapes);
    const dropDownOptions = makeCampaignsDropDown(campaigns);
    const getShapeStylesRound1 = useCallback(
        shape => {
            const status = determineStatusForDistrict(
                findLQASDataForShape(shape.name, LQASData, 'round1'),
            );
            return districtColors[status];
        },
        [LQASData],
    );

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.lqas)}
                displayBackButton={false}
            />
            <Grid container spacing={4} justifyContent="flex-end">
                <Grid item xs={4}>
                    <Box mr={2}>
                        <Select
                            keyValue="campaigns"
                            label={formatMessage(MESSAGES.campaign)}
                            loading={campaignsLoading}
                            clearable
                            multi={false}
                            value={campaign}
                            options={dropDownOptions}
                            onChange={value => setCampaign(value)}
                        />
                    </Box>
                </Grid>
            </Grid>
            {/* {!isLoading && ( */}
            <MapComponent
                name="LQASMap"
                mainLayer={shapes}
                onSelectShape={() => null}
                getMainLayerStyle={getShapeStylesRound1}
                // getBackgroundLayerStyle={getBackgroundLayerStyle}
                tooltipLabels={{ main: 'District', background: 'Region' }}
            />
            {/* )} */}
        </>
    );
};
