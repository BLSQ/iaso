import React, { FunctionComponent } from 'react';
import { useFormikContext } from 'formik';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { PolioCampaignValues } from '../../../../../constants/types';
import { IntegratedCampaignsInfo } from './IntegratedCampaignsInfo';

export const IntegratedCampaigns: FunctionComponent = () => {
    const { values } = useFormikContext<PolioCampaignValues>();

    return (
        <>
            {values.integrated_campaigns.length > 0 && (
                <WidgetPaper
                    title="Integrated campaigns"
                    elevation={1}
                    sx={{
                        marginBottom: theme => theme.spacing(2),

                        height: theme => theme.spacing(43), //344 px for alignment
                        overflow: 'auto',
                    }}
                >
                    <IntegratedCampaignsInfo
                        integratedCampaigns={values.integrated_campaigns}
                    />
                </WidgetPaper>
            )}
        </>
    );
};
