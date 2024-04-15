import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Link } from 'react-router-dom';
import { IconButton, Box, Tooltip } from '@mui/material';
import MESSAGES from '../../messages';
import { useCurrentUser } from '../../../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import { userHasOneOfPermissions } from '../../../../../../../../../hat/assets/js/apps/Iaso/domains/users/utils';
import {
    POLIO_SUPPLY_CHAIN_READ,
    POLIO_SUPPLY_CHAIN_WRITE,
} from '../../../../../../../../../hat/assets/js/apps/Iaso/utils/permissions';

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
    const currentUser = useCurrentUser();
    return (
        <Box>
            <span>{title}</span>
            {id &&
                userHasOneOfPermissions(
                    [POLIO_SUPPLY_CHAIN_READ, POLIO_SUPPLY_CHAIN_WRITE],
                    currentUser,
                ) && <LinkToSupplyChain id={id} />}
        </Box>
    );
};
