import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Box } from '@material-ui/core';
import { Router } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import MESSAGES from '../../../constants/messages';
import { useStyles } from '../../../styles/theme';
import { Nopv2AuthorisationsFilters } from './Filters/Nopv2AuthorisationsFilters';
import { Nopv2AuthorisationsTable } from './Table/Nopv2AuthorisationsTable';

type Props = { router: Router };

export const Nopv2Authorisations: FunctionComponent<Props> = ({ router }) => {
    const { params } = router;
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.nopv2Auth)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Nopv2AuthorisationsFilters params={params} />
                <Nopv2AuthorisationsTable params={params} />
            </Box>
        </>
    );
};
