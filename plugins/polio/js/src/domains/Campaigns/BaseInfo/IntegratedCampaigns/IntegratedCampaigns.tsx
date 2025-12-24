import { useFormikContext } from 'formik';
import React, { FunctionComponent } from 'react';
import { CampaignFormValues } from '../../../../constants/types';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { IntegratedCampaignsInfo } from './IntegratedCampaignsInfo';

type Props = {};

export const IntegratedCampaigns: FunctionComponent<Props> = () => {
    const { values, touched, setFieldValue, setTouched } =
        useFormikContext<CampaignFormValues>();

    return (
        <WidgetPaper title="Integrated campaigns" elevation={1}>
            <IntegratedCampaignsInfo
                integratedCampaigns={values.integrated_campaigns}
            />
        </WidgetPaper>
    );
};
