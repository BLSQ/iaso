import React, { FunctionComponent } from 'react';
import { Table, TableBody, TableRow, TableCell, Box } from '@mui/material';
import { useFormikContext } from 'formik';
import { IntegratedCampaignRow } from './IntegratedCampaignRow';

type Props = { integratedCampaigns?: any[] };

export const IntegratedCampaignsInfo: FunctionComponent<Props> = ({
    integratedCampaigns = [],
}) => {
    const { initialValues } = useFormikContext();
    const initialIntegrated =
        initialValues?.integrated_campaigns.map(cmp => cmp.obr_name) ?? [];
    return (
        <Table size="small">
            <TableBody>
                {integratedCampaigns.map(camp => (
                    <IntegratedCampaignRow
                        key={camp.obr_name}
                        campaignOption={camp}
                        initialIntegrated={initialIntegrated}
                    />
                ))}
            </TableBody>
        </Table>
    );
};
