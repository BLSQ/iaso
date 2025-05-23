import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { FormikProps } from 'formik';
import MESSAGES from '../../../constants/messages';
import { Campaign, CampaignFormValues } from '../../../constants/types';
import { compareArraysValues } from '../../../utils/compareArraysValues';
import { BaseInfoForm, baseInfoFormFields } from '../BaseInfo/BaseInfoForm';
import {
    EvaluationsForms,
    evaluationFormFields,
} from '../Evaluations/EvaluationsForms';
import { useIsPolioCampaign } from '../hooks/useIsPolioCampaignCheck';
import { useSubActivityTabTooltip } from '../hooks/useSubActivityTabTooltip';
import { PreparednessForm } from '../Preparedness/PreparednessForm';
import {
    RiskAssessmentForm,
    riskAssessmentFormFields,
} from '../RiskAssessment/RiskAssessmentForm';
import { RoundsForm, roundFormFields } from '../Rounds/RoundsForm';
import { ScopeForm, scopeFormFields } from '../Scope/ScopeForm';
import { SubActivitiesForm } from '../SubActivities/SubActivitiesForm';
import { Tab } from './PolioDialogTabs';

export const usePolioDialogTabs = (
    formik: FormikProps<CampaignFormValues>,
    selectedCampaign: Campaign,
): Tab[] => {
    const { formatMessage } = useSafeIntl();
    const isPolio = useIsPolioCampaign(formik.values);
    const subActivityTooltipMsg = useSubActivityTabTooltip(formik);
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
                disabled: !formik.values.initial_org_unit,
                hasTabError:
                    compareArraysValues(
                        roundFormFields(selectedCampaign?.rounds ?? []),
                        formik.errors,
                    ) || compareArraysValues(scopeFormFields, formik.errors),
            },
            {
                title: formatMessage(MESSAGES.scope),
                form: ScopeForm,
                disabled:
                    !formik.values.initial_org_unit ||
                    formik.values.rounds?.length === 0,
                disabledMessage: formatMessage(MESSAGES.scopeUnlockConditions),
                hasTabError: compareArraysValues(
                    scopeFormFields,
                    formik.errors,
                ),
                key: 'scope',
            },
            {
                title: formatMessage(MESSAGES.subActivities),
                form: SubActivitiesForm,
                key: 'subActivities',
                disabled:
                    !formik.values.initial_org_unit ||
                    formik.values.rounds.length === 0 ||
                    Boolean(
                        formik.values.id &&
                            formik.values.separate_scopes_per_round !==
                                formik.initialValues.separate_scopes_per_round,
                    ) ||
                    formik.values.rounds.filter(r => !r.on_hold).length === 0,
                disabledMessage: subActivityTooltipMsg,
                hasTabError: false,
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
                title: formatMessage(MESSAGES.preparedness),
                form: PreparednessForm,
                key: 'preparedness',
                hasTabError: false,
            },
        ];
        if (isPolio) {
            return [...defaultTabs, ...polioTabs];
        }
        return defaultTabs;
    }, [
        formatMessage,
        formik.errors,
        formik.initialValues.separate_scopes_per_round,
        formik.values.id,
        formik.values.initial_org_unit,
        formik.values.rounds.length,
        formik.values.separate_scopes_per_round,
        isPolio,
        selectedCampaign?.rounds,
        subActivityTooltipMsg,
    ]);
};
