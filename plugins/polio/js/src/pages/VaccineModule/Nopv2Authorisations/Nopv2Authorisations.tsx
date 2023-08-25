import React, { FunctionComponent, useEffect } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Box } from '@material-ui/core';
import { useDispatch } from 'react-redux';
import { Router } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import MESSAGES from '../../../constants/messages';
import { useStyles } from '../../../styles/theme';
import { Nopv2AuthorisationsFilters } from './Filters/Nopv2AuthorisationsFilters';
import { Nopv2AuthorisationsTable } from './Table/Nopv2AuthorisationsTable';
import { VaccineAuthParams } from './types';
import { redirectToReplace } from '../../../../../../../hat/assets/js/apps/Iaso/routing/actions';
import { NOPV2_AUTH } from '../../../constants/routes';

const defaultParams = {
    order: '-current_expiration_date',
    pageSize: 20,
    page: 1,
};

type Props = { router: Router };

export const Nopv2Authorisations: FunctionComponent<Props> = ({ router }) => {
    const { params } = router;
    const dispatch = useDispatch();
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
            dispatch(redirectToReplace(NOPV2_AUTH, newParams));
        }
    }, [dispatch, params]);
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
