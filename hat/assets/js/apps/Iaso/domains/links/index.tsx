import React from 'react';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl, useGoBack, commonStyles } from 'bluesquare-components';
import { useLocation } from 'react-router-dom';
import { useIsFetching, useQueryClient } from 'react-query';
import TopBar from '../../components/nav/TopBarComponent';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { LinksFilters } from './components/LinksFilters';
import { LinksTable } from './components/LinksTable';
import MESSAGES from './messages';
import DownloadButtonsComponent from '../../components/DownloadButtonsComponent';
import { tableDefaults } from './hooks/useGetLinks';
import { makeQueryString } from '../../routing/utils';

const baseUrl = baseUrls.links;
const dwnldBaseUrl = '/api/links';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    table: {
        '& tr:nth-of-type(odd) .bg-star path': {
            fill: '#f7f7f7 !important',
        },
    },
}));
export const Links = () => {
    const params = useParamsObject(baseUrl);
    const goBack = useGoBack(baseUrls.orgUnits);
    const location = useLocation();
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const queryClient = useQueryClient();
    const hasLinksData = Boolean(queryClient.getQueriesData(['links']));

    const displayBackButton = location?.state?.location.includes(
        baseUrls.algos,
    );
    const csvUrl = `${dwnldBaseUrl}/?${makeQueryString(
        params,
        tableDefaults,
    )}&csv=true`;
    const xlsxUrl = `${dwnldBaseUrl}/?${makeQueryString(
        params,
        tableDefaults,
    )}&xlsx=true`;

    const isFetching = useIsFetching({ queryKey: ['links'] });
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={displayBackButton}
                goBack={() => goBack()}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Box mb={2}>
                    <LinksFilters params={params} baseUrl={baseUrl} />
                </Box>
                {Boolean(params.searchActive) && (
                    <Grid container justifyContent="flex-end">
                        <DownloadButtonsComponent
                            xlsxUrl={xlsxUrl}
                            csvUrl={csvUrl}
                            disabled={Boolean(isFetching) || !hasLinksData}
                        />
                    </Grid>
                )}
                <Box className={classes.table}>
                    <LinksTable params={params} baseUrl={baseUrl} />
                </Box>

                {/* <SingleTable
                    baseUrl={baseUrl}
                    endPointPath="links"
                    hideGpkg
                    dataKey="links"
                    apiParams={{
                        ...apiParams,
                    }}
                    forceRefresh={forceRefresh}
                    onForceRefreshDone={() => setForceRefresh(false)}
                    searchActive={params.searchActive === 'true'}
                    fetchItems={fetchLinks}
                    defaultSorted={[{ id: 'similarity_score', desc: true }]}
                    toggleActiveSearch
                    columns={tableColumns}
                    filters={linksFilters({
                        formatMessage,
                        algorithmRuns,
                        orgUnitTypes,
                        profiles,
                        algorithms,
                        sources,
                        currentOrigin,
                        currentDestination,
                        fetchingRuns,
                        fetchingOrgUnitTypes,
                        fetchingProfiles,
                        fetchingAlgorithms,
                        fetchingSources,
                    })}
                    onDataLoaded={({ list, count, pages }) => {
                        onDataLoaded(list, count, pages);
                    }}
                    extraProps={{
                        expanded,
                        onExpandedChange: newExpanded =>
                            setExpanded(newExpanded),
                    }}
                    // This is just a redirection
                    subComponent={link =>
                        link ? (
                            <LinksDetails
                                linkId={link.id}
                                validated={link.validated}
                                validateLink={() => validateLink(link)}
                            />
                        ) : null
                    }
                    filtersColumnsCount={4}
                /> */}
            </Box>
        </>
    );
};

export default Links;
