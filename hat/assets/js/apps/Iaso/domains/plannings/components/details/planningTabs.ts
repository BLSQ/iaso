import { useCallback } from 'react';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import {
    IntlMessage,
    useRedirectToReplace,
    useSafeIntl,
} from 'bluesquare-components';
import { baseUrls } from 'Iaso/constants/urls';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { PlanningFormik } from '../../hooks/usePlanningForm';
import MESSAGES from '../../messages';

export type TabKey = 'info' | 'levelsAndTeams';

type PlanningField = keyof PlanningFormik['values'];

type PlanningTab = {
    key: TabKey;
    label: IntlMessage;
    Icon: typeof TuneIcon;
    fields: { name: PlanningField; label: IntlMessage }[];
};

export const PLANNING_TABS: PlanningTab[] = [
    {
        key: 'info',
        label: MESSAGES.info,
        Icon: TuneIcon,
        fields: [
            { name: 'name', label: MESSAGES.name },
            { name: 'description', label: MESSAGES.description },
            { name: 'startDate', label: MESSAGES.startDatefrom },
            { name: 'endDate', label: MESSAGES.endDateUntil },
            { name: 'project', label: MESSAGES.project },
            { name: 'publishingStatus', label: MESSAGES.publishingStatus },
            { name: 'missions', label: MESSAGES.missions },
        ],
    },
    {
        key: 'levelsAndTeams',
        label: MESSAGES.levelsAndTeams,
        Icon: AccountTreeOutlinedIcon,
        fields: [
            { name: 'selectedOrgUnit', label: MESSAGES.selectOrgUnit },
            { name: 'selectedTeam', label: MESSAGES.rootTeam },
        ],
    },
];

export const getActiveTab = (tab?: string): TabKey =>
    PLANNING_TABS.find(({ key }) => key === tab)?.key ?? 'info';

export const useSelectPlanningTab = (): ((tab: TabKey) => void) => {
    const params = useParamsObject(baseUrls.planningDetails);
    const redirectToReplace = useRedirectToReplace();
    return useCallback(
        (tab: TabKey) =>
            redirectToReplace(baseUrls.planningDetails, { ...params, tab }),
        [redirectToReplace, params],
    );
};

type FormatMessage = ReturnType<typeof useSafeIntl>['formatMessage'];

export const getFieldsToFix = (
    { fields }: PlanningTab,
    errors: PlanningFormik['errors'],
    formatMessage: FormatMessage,
): string[] =>
    fields
        .filter(({ name }) => errors[name])
        .map(({ label }) => formatMessage(label));
