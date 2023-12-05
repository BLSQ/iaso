import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Box } from '@mui/material';
import { Router } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { useStyles } from '../../../styles/theme';
import MESSAGES from './messages';
import { VaccineSupplyChainTable } from './Table/VaccineSupplyChainTable';
import { VaccineSupplyChainFilters } from './Filters/VaccineSupplyChainFilters';

type Props = { router: Router };

export const VaccineSupplyChain: FunctionComponent<Props> = ({ router }) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.vaccineSupplyChain)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <VaccineSupplyChainFilters params={router.params} />
                <VaccineSupplyChainTable params={router.params} />
            </Box>
        </>
    );
};
