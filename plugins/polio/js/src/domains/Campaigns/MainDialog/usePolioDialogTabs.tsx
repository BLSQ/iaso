import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { FormikProps } from 'formik';
import MESSAGES from '../../../constants/messages';
import { compareArraysValues } from '../../../utils/compareArraysValues';
import { BaseInfoForm, baseInfoFormFields } from '../BaseInfo/BaseInfoForm';
import { RoundsForm, roundFormFields } from '../Rounds/RoundsForm';
import { Campaign } from '../../../constants/types';
import {
    RiskAssessmentForm,
    riskAssessmentFormFields,
} from '../RiskAssessment/RiskAssessmentForm';
import { ScopeForm, scopeFormFields } from '../Scope/ScopeForm';
import { BudgetForm, budgetFormFields } from '../Budget/BudgetForm';
import { PreparednessForm } from '../Preparedness/PreparednessForm';
import { Tab } from './PolioDialogTabs';

export const usePolioDialogTabs = (
    formik: FormikProps<any>,
    selectedCampaign: Campaign,
): Tab[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                title: formatMessage(MESSAGES.baseInfo),
                form: BaseInfoForm,
                hasTabError: compareArraysValues(
                    baseInfoFormFields,
                    formik.errors,
                ),
                key: 'baseInfo',
            },
            {
                title: formatMessage(MESSAGES.rounds),
                form: RoundsForm,
                key: 'rounds',
                hasTabError: compareArraysValues(
                    roundFormFields(selectedCampaign?.rounds ?? []),
                    formik.errors,
                ),
            },
            {
                title: formatMessage(MESSAGES.riskAssessment),
                form: RiskAssessmentForm,
                hasTabError: compareArraysValues(
                    riskAssessmentFormFields,
                    formik.errors,
                ),
                key: 'riskAssessment',
            },
            {
                title: formatMessage(MESSAGES.scope),
                form: ScopeForm,
                disabled:
                    !formik.values.initial_org_unit ||
                    formik.values.rounds.length === 0,
                hasTabError: compareArraysValues(
                    scopeFormFields,
                    formik.errors,
                ),
                key: 'scope',
            },
            {
                title: formatMessage(MESSAGES.budget),
                form: BudgetForm,
                hasTabError: compareArraysValues(
                    budgetFormFields(selectedCampaign?.rounds ?? []),
                    formik.errors,
                ),
                key: 'budget',
            },
            {
                title: formatMessage(MESSAGES.preparedness),
                form: PreparednessForm,
                key: 'preparedness',
                hasTabError: false,
            },
        ];
    }, [
        formatMessage,
        formik.errors,
        formik.values.initial_org_unit,
        formik.values.rounds.length,
        selectedCampaign?.rounds,
    ]);
};
