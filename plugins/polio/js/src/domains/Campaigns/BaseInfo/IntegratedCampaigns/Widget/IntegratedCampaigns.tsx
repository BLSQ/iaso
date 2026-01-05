import React, { FunctionComponent } from 'react';
import { useFormikContext } from 'formik';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { PolioCampaignValues } from '../../../../../constants/types';
import { IntegratedCampaignsInfo } from './IntegratedCampaignsInfo';

type Props = {};

export const IntegratedCampaigns: FunctionComponent<Props> = () => {
    const { values } = useFormikContext<PolioCampaignValues>();

    return (
        <>
            {values.integrated_campaigns.length > 0 && (
                <WidgetPaper
                    title="Integrated campaigns"
                    elevation={1}
                    sx={{
                        //@ts-ignore
                        marginBottom: theme => theme.spacing(2),
                        //@ts-ignore
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
