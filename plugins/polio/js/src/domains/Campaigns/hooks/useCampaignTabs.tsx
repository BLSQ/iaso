import { useCallback, useMemo, useState } from 'react';
import { usePolioDialogTabs } from '../MainDialog/usePolioDialogTabs';

export const useCampaignTabs = ({ formik, selectedCampaign }) => {
    const tabs = usePolioDialogTabs(formik, selectedCampaign);
    const [selectedTab, setSelectedTab] = useState<number>(0);

    const safeSelectedTab = selectedTab < tabs.length ? selectedTab : 0;
    const ActiveForm = tabs[safeSelectedTab].form;
    const handleChangeTab = useCallback(
        (_event, newValue) => {
            setSelectedTab(newValue);
        },
        [setSelectedTab],
    );

    return useMemo(() => {
        return {
            tabs,
            ActiveForm,
            handleChangeTab,
            selectedTab: safeSelectedTab,
        };
    }, [tabs, ActiveForm, handleChangeTab, safeSelectedTab]);
};
