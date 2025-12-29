import React, { FunctionComponent } from 'react';
import { useFormikContext } from 'formik';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { CampaignFormValues } from '../../../../constants/types';
import { IntegratedCampaignsInfo } from './IntegratedCampaignsInfo';
import { AddIntegratedCampaignsModal } from './AddIntegratedCampaignsModal';

type Props = {};

export const IntegratedCampaigns: FunctionComponent<Props> = () => {
    const { values } = useFormikContext<CampaignFormValues>();

    return (
        <>
            <WidgetPaper
                title="Integrated campaigns"
                elevation={1}
                sx={{ marginBottom: theme => theme.spacing(2) }}
            >
                <IntegratedCampaignsInfo
                    integratedCampaigns={values.integrated_campaigns}
                />
            </WidgetPaper>

            <AddIntegratedCampaignsModal iconProps={{}} />
        </>
    );
};
