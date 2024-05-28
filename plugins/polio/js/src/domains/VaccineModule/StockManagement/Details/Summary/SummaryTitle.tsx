import React, { FunctionComponent } from 'react';
import { IconButton } from 'bluesquare-components';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Box } from '@mui/material';
import { DisplayIfUserHasPerm } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/DisplayIfUserHasPerm';
import MESSAGES from '../../messages';

import {
    POLIO_SUPPLY_CHAIN_READ,
    POLIO_SUPPLY_CHAIN_WRITE,
} from '../../../../../../../../../hat/assets/js/apps/Iaso/utils/permissions';
import { baseUrls } from '../../../../../constants/urls';

const route = `/${baseUrls.vaccineSupplyChain}/page/1/campaign__country/`;

type Props = { title: string; id?: string };
export const SummaryTitle: FunctionComponent<Props> = ({ title, id }) => {
    return (
        <Box>
            <span>{title}</span>
            {id && (
                <DisplayIfUserHasPerm
                    permissions={[
                        POLIO_SUPPLY_CHAIN_READ,
                        POLIO_SUPPLY_CHAIN_WRITE,
                    ]}
                >
                    <IconButton
                        overrideIcon={OpenInNewIcon}
                        url={`${route}${id}`}
                        target="_blank"
                        tooltipMessage={MESSAGES.seeSupplyChainForCountry}
                    />
                </DisplayIfUserHasPerm>
            )}
        </Box>
    );
};
