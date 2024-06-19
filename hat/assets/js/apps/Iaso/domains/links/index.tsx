import React, { FunctionComponent } from 'react';
import { useSafeIntl, useGoBack, commonStyles } from 'bluesquare-components';
import { useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import TopBar from '../../components/nav/TopBarComponent';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { LinksFilters } from './components/LinksFilters';
import { LinksTableWithDownloads } from './components/LinksTableWithDownloads';
import MESSAGES from './messages';

const useStyles = makeStyles(theme => ({
    containerFullHeightNoTabPadded:
        commonStyles(theme).containerFullHeightNoTabPadded,
}));

const baseUrl = baseUrls.links;

export const Links: FunctionComponent = () => {
    const params = useParamsObject(baseUrl);
    const goBack = useGoBack(baseUrls.orgUnits);
    const location = useLocation();
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();

    const displayBackButton = location?.state?.location.includes(
        baseUrls.algos,
    );
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={displayBackButton}
                goBack={() => goBack()}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <LinksTableWithDownloads params={params} baseUrl={baseUrl}>
                    <LinksFilters params={params} baseUrl={baseUrl} />
                </LinksTableWithDownloads>
            </Box>
        </>
    );
};
