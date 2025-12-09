import React, { FunctionComponent } from 'react';
import { PolioDialogTabs } from './MainDialog/PolioDialogTabs';
import { FormikProvider } from 'formik';

type Props = {
    campaignId?: string;
};

export const CampaignDetails: FunctionComponent<Props> = ({ campaignId }) => {
    return (
        <>
            <PolioDialogTabs
                tabs={tabs}
                selectedTab={selectedTab}
                handleChange={(_event, newValue) => {
                    setSelectedTab(newValue);
                }}
            />
            <FormikProvider value={formik}>
                <Form>
                    <CurrentForm />
                </Form>
            </FormikProvider>
            ;
        </>
    );
};
