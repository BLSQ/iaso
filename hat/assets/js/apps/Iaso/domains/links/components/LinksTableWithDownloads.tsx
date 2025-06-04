import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { FunctionComponent, ReactElement, useState } from 'react';
import DownloadButtonsComponent from '../../../components/DownloadButtonsComponent';
import { usePrefixedParams } from '../../../routing/hooks/usePrefixedParams';
import { makeQueryString } from '../../../routing/utils';
import { tableDefaults, useGetLinks } from '../hooks/useGetLinks';
import { LinksTable } from './LinksTable';

const dwnldBaseUrl = '/api/links';

const useStyles = makeStyles({
    table: {
        '& tr:nth-of-type(odd) .bg-star path': {
            fill: '#f7f7f7 !important',
        },
    },
});

type Props = {
    params: Record<string, string>;
    baseUrl: string;
    paramsPrefix?: string;
    children: ReactElement;
};

export const LinksTableWithDownloads: FunctionComponent<Props> = ({
    params,
    baseUrl,
    paramsPrefix,
    children,
}) => {
    const classes = useStyles();
    const [expanded, setExpanded] = useState({});
    const onSuccess = () => {
        setExpanded({});
    };
    const apiParams = usePrefixedParams(paramsPrefix, params);

    // The orgUnitId is passed only in orgUnit details, so it can be used to trigger the API call
    const enabled = paramsPrefix
        ? Boolean(apiParams?.orgUnitId)
        : Boolean(apiParams?.searchActive);

    const { data, isLoading: loading } = useGetLinks({
        params: apiParams,
        onSuccess,
        enabled,
    });

    // The condition on data?.links?.length was kept during refactoring to avoid changing the existing behaviour
    // We might want to consider removing it
    const displayDownloadButtons = paramsPrefix
        ? Boolean(data?.links?.length)
        : Boolean(params.searchActive);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    const { searchActive, tab, ...dnldParams } = apiParams;
    const csvUrl = `${dwnldBaseUrl}/?${makeQueryString(
        dnldParams,
        tableDefaults,
    )}&csv=true`;
    const xlsxUrl = `${dwnldBaseUrl}/?${makeQueryString(
        dnldParams,
        tableDefaults,
    )}&xlsx=true`;

    return (
        <>
            <Box mb={2}>{children}</Box>
            {displayDownloadButtons && (
                <Grid container justifyContent="flex-end">
                    <DownloadButtonsComponent
                        xlsxUrl={xlsxUrl}
                        csvUrl={csvUrl}
                        disabled={Boolean(loading) || !data?.links?.length}
                    />
                </Grid>
            )}
            {enabled && (
                <Box className={classes.table}>
                    <LinksTable
                        params={params}
                        baseUrl={baseUrl}
                        data={data}
                        loading={loading}
                        expanded={expanded}
                        setExpanded={setExpanded}
                        paramsPrefix={paramsPrefix}
                    />
                </Box>
            )}
        </>
    );
};
