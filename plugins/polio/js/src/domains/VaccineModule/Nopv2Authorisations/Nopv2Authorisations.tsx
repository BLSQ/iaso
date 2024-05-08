import React, { FunctionComponent, useEffect } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Box } from '@mui/material';
import { useParamsObject } from '../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import MESSAGES from '../../../constants/messages';
import { useStyles } from '../../../styles/theme';
import { Nopv2AuthorisationsFilters } from './Filters/Nopv2AuthorisationsFilters';
import { Nopv2AuthorisationsTable } from './Table/Nopv2AuthorisationsTable';
import { VaccineAuthParams } from './types';
import { baseUrls } from '../../../constants/urls';
import { useRedirectToReplace } from '../../../../../../../hat/assets/js/apps/Iaso/routing/routing';

const defaultParams = {
    order: '-current_expiration_date',
    pageSize: '20',
    page: '1',
};

const baseUrl = baseUrls.nopv2Auth;

export const Nopv2Authorisations: FunctionComponent = () => {
    const params = useParamsObject(baseUrl) as Partial<VaccineAuthParams>;
    const redirectToReplace = useRedirectToReplace();
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    useEffect(() => {
        const newParams: Partial<VaccineAuthParams> = { ...params };
        // Proceeding this way i.o spreading to keep key order and avoid 404
        if (!params.order) {
            newParams.order = defaultParams.order;
        }
        if (!params.pageSize) {
            newParams.pageSize = defaultParams.pageSize.toString();
        }
        if (!params.page) {
            newParams.page = defaultParams.page.toString();
        }
        if (!params.order || !params.pageSize || !params.page) {
            redirectToReplace(baseUrl, newParams);
        }
    }, [params, redirectToReplace]);
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.nopv2Auth)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Nopv2AuthorisationsFilters
                    params={params as VaccineAuthParams}
                />
                <Nopv2AuthorisationsTable
                    params={params as VaccineAuthParams}
                />
            </Box>
        </>
    );
};
