import { useCallback } from 'react';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import TuneIcon from '@mui/icons-material/Tune';
import { IntlMessage, useRedirectToReplace } from 'bluesquare-components';
import { baseUrls } from 'Iaso/constants/urls';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import MESSAGES from './messages';

export type TabKey = 'general' | 'steps';

type WorkflowTab = {
    key: TabKey;
    label: IntlMessage;
    Icon: typeof TuneIcon;
};

export const WORKFLOW_TABS: WorkflowTab[] = [
    {
        key: 'general',
        label: MESSAGES.general,
        Icon: TuneIcon,
    },
    {
        key: 'steps',
        label: MESSAGES.steps,
        Icon: FormatListNumberedIcon,
    },
];

export const getActiveTab = (tab?: string): TabKey =>
    WORKFLOW_TABS.find(({ key }) => key === tab)?.key ?? 'general';

export const useSelectWorkflowTab = (): ((tab: TabKey) => void) => {
    const params = useParamsObject(
        baseUrls.validationWorkflowsConfigurationDetail,
    );
    const redirectToReplace = useRedirectToReplace();
    return useCallback(
        (tab: TabKey) =>
            redirectToReplace(baseUrls.validationWorkflowsConfigurationDetail, {
                ...params,
                tab,
            }),
        [redirectToReplace, params],
    );
};
