import { useSafeIntl } from 'bluesquare-components';
import { FormikProps } from 'formik';
import { useMemo } from 'react';
import MESSAGES from '../../../constants/messages';
import { Campaign } from '../../../constants/types';
import { compareArraysValues } from '../../../utils/compareArraysValues';
import { BaseInfoForm, baseInfoFormFields } from '../BaseInfo/BaseInfoForm';
import { BudgetForm, budgetFormFields } from '../Budget/BudgetForm';
import { EvaluationsForms } from '../Evaluations/EvaluationsForms';
import { PreparednessForm } from '../Preparedness/PreparednessForm';
import {
    RiskAssessmentForm,
    riskAssessmentFormFields,
} from '../RiskAssessment/RiskAssessmentForm';
import { RoundsForm, roundFormFields } from '../Rounds/RoundsForm';
import { scopeFormFields } from '../Scope/ScopeForm';
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
                diabled: !formik.values.initial_org_unit,
                hasTabError:
                    compareArraysValues(
                        roundFormFields(selectedCampaign?.rounds ?? []),
                        formik.errors,
                    ) || compareArraysValues(scopeFormFields, formik.errors),
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
                title: formatMessage(MESSAGES.evaluation),
                form: EvaluationsForms,
                disabled:
                    !formik.values.initial_org_unit ||
                    formik.values.rounds.length === 0,
                hasTabError: compareArraysValues(
                    scopeFormFields,
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
    }, [
        formatMessage,
        formik.errors,
        formik.values.initial_org_unit,
        formik.values.rounds.length,
        selectedCampaign?.rounds,
    ]);
};
