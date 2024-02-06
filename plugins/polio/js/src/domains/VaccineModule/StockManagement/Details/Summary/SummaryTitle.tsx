import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { IconButton, Box, Tooltip } from '@mui/material';
import MESSAGES from '../../messages';

const route =
    '/dashboard/polio/vaccinemodule/supplychain/accountId/1/page/1/campaign__country/';

type LinkProps = { id: string };
const LinkToSupplyChain: FunctionComponent<LinkProps> = ({ id }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Tooltip title={formatMessage(MESSAGES.seeSupplyChainForCountry)}>
            <IconButton target="_blank" href={`${route}${id}`} color="primary">
                <OpenInNewIcon />
            </IconButton>
        </Tooltip>
    );
};

type Props = { title: string; id?: string };
export const SummaryTitle: FunctionComponent<Props> = ({ title, id }) => {
    return (
        <Box>
            <span>{title}</span>
            {id && <LinkToSupplyChain id={id} />}
        </Box>
    );
};
