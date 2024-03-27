import { useSafeIntl } from 'bluesquare-components';
import { FormikProps } from 'formik';
import { useMemo } from 'react';
import MESSAGES from '../../../constants/messages';
import { Campaign, CampaignFormValues } from '../../../constants/types';
import { compareArraysValues } from '../../../utils/compareArraysValues';
import { BaseInfoForm, baseInfoFormFields } from '../BaseInfo/BaseInfoForm';
import { BudgetForm, budgetFormFields } from '../Budget/BudgetForm';
import {
    EvaluationsForms,
    evaluationFormFields,
} from '../Evaluations/EvaluationsForms';
import { PreparednessForm } from '../Preparedness/PreparednessForm';
import {
    RiskAssessmentForm,
    riskAssessmentFormFields,
} from '../RiskAssessment/RiskAssessmentForm';
import { RoundsForm, roundFormFields } from '../Rounds/RoundsForm';
import { scopeFormFields } from '../Scope/ScopeForm';
import { useIsPolioCampaignCheck } from '../hooks/useIsPolioCampaignCheck';
import { Tab } from './PolioDialogTabs';

export const usePolioDialogTabs = (
    formik: FormikProps<CampaignFormValues>,
    selectedCampaign: Campaign,
): Tab[] => {
    const { formatMessage } = useSafeIntl();
    const isPolio = useIsPolioCampaignCheck();

    return useMemo(() => {
        const defaultTabs = [
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
                diabled: !formik.values.initial_org_unit,
                hasTabError:
                    compareArraysValues(
                        roundFormFields(selectedCampaign?.rounds ?? []),
                        formik.errors,
                    ) || compareArraysValues(scopeFormFields, formik.errors),
            },
        ];
        const polioTabs = [
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
                title: formatMessage(MESSAGES.evaluation),
                form: EvaluationsForms,
                disabled:
                    !formik.values.initial_org_unit ||
                    formik.values.rounds?.length === 0,
                hasTabError: compareArraysValues(
                    evaluationFormFields(selectedCampaign?.rounds ?? []),
                    formik.errors,
                ),
                key: 'evaluation',
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
        if (isPolio(formik.values)) {
            return [...defaultTabs, ...polioTabs];
        }
        return defaultTabs;
    }, [
        formatMessage,
        formik.errors,
        formik.values,
        isPolio,
        selectedCampaign?.rounds,
    ]);
};
