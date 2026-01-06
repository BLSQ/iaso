import React, { FunctionComponent } from 'react';
import { useFormikContext } from 'formik';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import {
    CampaignFormValues,
    PolioCampaignValues,
} from '../../../../../constants/types';
import { IntegratedCampaignsInfo } from './IntegratedCampaignsInfo';
import { AddIntegratedCampaignsModal } from './AddIntegratedCampaignsModal';

type Props = {};

export const IntegratedCampaigns: FunctionComponent<Props> = () => {
    const { values } = useFormikContext<PolioCampaignValues>();

    return (
        <>
            {values.integrated_campaigns.length > 0 && (
                <WidgetPaper
                    title="Integrated campaigns"
                    elevation={1}
                    //@ts-ignore
                    sx={{ marginBottom: theme => theme.spacing(2) }}
                >
                    <IntegratedCampaignsInfo
                        integratedCampaigns={values.integrated_campaigns}
                    />
                </WidgetPaper>
            )}

            <AddIntegratedCampaignsModal iconProps={{}} />
        </>
    );
};
