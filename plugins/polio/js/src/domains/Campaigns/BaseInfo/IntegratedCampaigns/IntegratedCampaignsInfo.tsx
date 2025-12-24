import React, { FunctionComponent } from 'react';
import { Table, TableBody, TableRow, TableCell } from '@mui/material';
import { LinkTo } from 'Iaso/components/nav/LinkTo';

type Props = { integratedCampaigns?: any[] };

export const IntegratedCampaignsInfo: FunctionComponent<Props> = ({
    integratedCampaigns = [],
}) => {
    return (
        <Table size="small">
            <TableBody>
                {integratedCampaigns.map(camp => (
                    <TableRow>
                        <TableCell>{camp.obr_name}</TableCell>
                        <TableCell>
                            {camp.campaign_types.map(ct => ct.name).join(',')}
                        </TableCell>
                        <TableCell>
                            {/*  TODO use modal/drawer to keep react query cache up to date */}
                            <LinkTo
                                useIcon
                                condition
                                url={`campaignId/${camp.id}`}
                            />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};
