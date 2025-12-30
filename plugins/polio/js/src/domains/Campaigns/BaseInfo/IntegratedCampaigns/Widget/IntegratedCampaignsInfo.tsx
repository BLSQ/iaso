import React, { FunctionComponent } from 'react';
import { Table, TableBody } from '@mui/material';
import { IntegratedCampaignRow } from './IntegratedCampaignRow';

type Props = { integratedCampaigns?: any[] };

export const IntegratedCampaignsInfo: FunctionComponent<Props> = ({
    integratedCampaigns = [],
}) => {
    return (
        <Table size="small">
            <TableBody>
                {integratedCampaigns.map(camp => (
                    <IntegratedCampaignRow
                        key={camp.obr_name}
                        campaignOption={camp}
                    />
                ))}
            </TableBody>
        </Table>
    );
};
