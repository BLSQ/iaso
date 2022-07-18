import React, { FunctionComponent } from 'react';
import { makeStyles, Box } from '@material-ui/core';
// @ts-ignore
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { useDispatch } from 'react-redux';

import TopBar from '../../components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';

import { redirectTo } from '../../routing/actions';

import { UrlParams } from '../../types/table';

import { baseUrls } from '../../constants/urls';
import MESSAGES from './messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type OrgUnitParams = UrlParams & {
    locationLimit: string;
    tab?: string;
    searchTabIndex: string;
    searchActive: string;
    searches: string;
};

type Props = {
    params: OrgUnitParams;
};

const baseUrl = baseUrls.orgUnitsNew;
export const OrgUnits: FunctionComponent<Props> = ({ params }) => {
    const dispatch = useDispatch();
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                FILTERS, LIST, MAP
            </Box>
        </>
    );
};
