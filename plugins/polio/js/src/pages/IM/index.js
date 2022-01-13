import React, { useState, useMemo } from 'react';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { useSafeIntl, Select } from 'bluesquare-components';

import { Grid, Box, makeStyles } from '@material-ui/core';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import { oneOf } from 'prop-types';
import MESSAGES from '../../constants/messages';
import { useGetCampaigns } from '../../hooks/useGetCampaigns';
import { DistrictsNotFound } from '../../components/LQAS-IM/DistrictsNotFound.tsx';
import { useLqasIm } from './requests';
import { LqasImMap } from '../../components/LQAS-IM/LqasImMap';
import { makeCampaignsDropDown } from '../../utils/index';
import { NoFingerMark } from '../../components/LQAS-IM/NoFingerMark.tsx';
import { GraphTitle } from '../../components/LQAS-IM/GraphTitle.tsx';
import { LqasImPercentageChart } from '../../components/LQAS-IM/LqasImPercentageChart.tsx';
import { findCountryIds } from '../../utils/LqasIm.tsx';
import { DatesIgnored } from '../../components/LQAS-IM/DatesIgnored.tsx';
import { LqasImMapHeader } from '../../components/LQAS-IM/LqasImMapHeader.tsx';

const styles = theme => ({
    filter: { paddingTop: theme.spacing(4), paddingBottom: theme.spacing(4) },
    // TODO use styling from commonStyles. overflow-x issue needs to be delat with though
    container: {
        overflowY: 'auto',
        overflowX: 'hidden',
        height: `calc(100vh - 65px)`,
        maxWidth: '100vw',
    },
});

const useStyles = makeStyles(styles);

export const ImStats = ({ imType }) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const [campaign, setCampaign] = useState();
    const { data: imData, isLoading } = useLqasIm(imType);

    const countryIds = findCountryIds(imData).toString();
    const { data: campaigns = [], isLoading: campaignsLoading } =
        useGetCampaigns({
            countries: countryIds,
            enabled: Boolean(countryIds),
        }).query;

    const countryOfSelectedCampaign = campaigns.filter(
        campaignOption => campaignOption.obr_name === campaign,
    )[0]?.top_level_org_unit_id;

    const dropDownOptions = useMemo(
        () => makeCampaignsDropDown(campaigns),
        [campaigns],
    );

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES[imType])}
                displayBackButton={false}
            />
            <Grid container className={classes.container}>
                <Grid
                    container
                    item
                    spacing={4}
                    justifyContent="space-between"
                    className={classes.filter}
                >
                    <Grid item xs={4}>
                        <Box ml={2}>
                            <Select
                                keyValue="campaigns"
                                label={formatMessage(MESSAGES.campaign)}
                                loading={!countryIds || campaignsLoading}
                                clearable
                                multi={false}
                                value={campaign}
                                options={dropDownOptions}
                                onChange={value => setCampaign(value)}
                            />
                        </Box>
                    </Grid>
                </Grid>
                <Grid container item spacing={2} direction="row">
                    <Grid item xs={6}>
                        <Box ml={2}>
                            <LqasImMapHeader round="round_1" />
                            <LqasImMap
                                round="round_1"
                                selectedCampaign={campaign}
                                type={imType}
                                countryId={countryOfSelectedCampaign}
                                campaigns={campaigns}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={6} mr={2}>
                        <Box mr={2}>
                            <LqasImMapHeader round="round_2" />
                            <LqasImMap
                                round="round_2"
                                selectedCampaign={campaign}
                                type={imType}
                                countryId={countryOfSelectedCampaign}
                                campaigns={campaigns}
                            />
                        </Box>
                    </Grid>
                </Grid>
                <Grid container item spacing={2} direction="row">
                    <Grid item xs={12}>
                        <Box ml={2} mt={2}>
                            <GraphTitle
                                text={formatMessage(MESSAGES.imPerRegion)}
                                displayTrigger={campaign}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={6} mr={2}>
                        <Box ml={2} mt={2}>
                            <LqasImPercentageChart
                                type={imType}
                                round="round_1"
                                campaign={campaign}
                                countryId={countryOfSelectedCampaign}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={6} mr={2}>
                        <Box mr={2} mt={2}>
                            <LqasImPercentageChart
                                type={imType}
                                round="round_2"
                                campaign={campaign}
                                countryId={countryOfSelectedCampaign}
                            />
                        </Box>
                    </Grid>
                </Grid>
                {imType === 'imIHH' && (
                    <Grid container item spacing={2} direction="row">
                        <Grid item xs={12}>
                            <Box ml={2} mt={2}>
                                <GraphTitle
                                    text={formatMessage(
                                        MESSAGES.reasonsNoFingerMarked,
                                    )}
                                    displayTrigger={campaign}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={6} mr={2}>
                            <Box ml={2} mt={2}>
                                <NoFingerMark
                                    data={imData.stats}
                                    campaign={campaign}
                                    round="round_1"
                                    type="IM"
                                    chartKey="nfmRound1"
                                    isLoading={isLoading}
                                    showChart={Boolean(campaign)}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={6} mr={2}>
                            <Box mr={2} mt={2}>
                                <NoFingerMark
                                    data={imData.stats}
                                    campaign={campaign}
                                    round="round_2"
                                    type="IM"
                                    chartKey="nfmRound2"
                                    isLoading={isLoading}
                                    showChart={Boolean(campaign)}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                )}
                <DisplayIfUserHasPerm permission="iaso_polio_config">
                    <Grid container item>
                        <Grid item xs={4}>
                            <Box ml={2} mb={4}>
                                <DistrictsNotFound
                                    campaign={campaign}
                                    data={imData.stats}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={4}>
                            <Box ml={2} mb={4}>
                                <DatesIgnored
                                    campaign={campaign}
                                    data={imData}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </DisplayIfUserHasPerm>
            </Grid>
        </>
    );
};
ImStats.defaultProps = {
    imType: 'imGlobal',
};

ImStats.propTypes = { imType: oneOf(['imGlobal', 'imIHH', 'imOHH']) };
