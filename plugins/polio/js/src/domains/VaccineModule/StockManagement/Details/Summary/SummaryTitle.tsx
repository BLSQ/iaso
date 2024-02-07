import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Link } from 'react-router';
import { IconButton, Box, Tooltip } from '@mui/material';
import MESSAGES from '../../messages';

const route =
    '/polio/vaccinemodule/supplychain/accountId/1/page/1/campaign__country/';

type LinkProps = { id: string };
const LinkToSupplyChain: FunctionComponent<LinkProps> = ({ id }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Link target="_blank" to={`${route}${id}`}>
            <Tooltip title={formatMessage(MESSAGES.seeSupplyChainForCountry)}>
                <IconButton color="primary">
                    <OpenInNewIcon />
                </IconButton>
            </Tooltip>
        </Link>
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
