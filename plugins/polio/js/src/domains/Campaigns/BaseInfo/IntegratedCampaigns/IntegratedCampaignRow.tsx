import React, { FunctionComponent, useCallback } from 'react';
import { TableRow, TableCell, Box } from '@mui/material';
import { LinkTo } from 'Iaso/components/nav/LinkTo';
import { DeleteIconButton } from 'Iaso/components/Buttons/DeleteIconButton';
import { useFormikContext } from 'formik';
import { PolioCampaignValues } from 'plugins/polio/js/src/constants/types';

type Props = {
    campaignOption: {
        obr_name: string;
        id: string;
        campaign_types: { id: number; name: string }[];
    };
};

export const IntegratedCampaignRow: FunctionComponent<Props> = ({
    campaignOption,
}) => {
    const { setFieldValue, setFieldTouched, values } =
        useFormikContext<PolioCampaignValues>();
    const handleDelete = useCallback(
        campaignOption => {
            const newValue = values.integrated_campaigns.filter(
                camp => camp.obr_name !== campaignOption.obr_name,
            );
            setFieldTouched('integrated_campaigns', true);
            setFieldValue('integrated_campaigns', newValue);
        },
        [setFieldValue, setFieldTouched, values.integrated_campaigns],
    );
    return (
        <TableRow key={campaignOption.obr_name}>
            <TableCell>{campaignOption.obr_name}</TableCell>
            <TableCell>
                {campaignOption.campaign_types.map(ct => ct.name).join(',')}
            </TableCell>
            <TableCell
                align="center"
                sx={{ padding: theme => theme.spacing(1, 2) }}
            >
                {/*  TODO use modal/drawer to keep react query cache up to date */}

                <LinkTo
                    useIcon
                    condition
                    url={`accountId/1/campaignId/${campaignOption.id}`}
                    icon="edit"
                />

                <DeleteIconButton
                    onClick={() => handleDelete(campaignOption)}
                />
            </TableCell>
        </TableRow>
    );
};
