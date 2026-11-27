import { useCallback } from 'react';
import { useRedirectToReplace, useSafeIntl } from 'bluesquare-components';
import { useFormik } from 'formik';
import moment from 'moment';
import { baseUrls } from 'Iaso/constants/urls';
import { useApiErrorValidation } from 'Iaso/libs/validation';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { FormatMessage } from 'Iaso/types/general';
import { SavedPlanningConfig } from '../components/orgUnitLevels/types';
import { configsToLevels } from '../components/orgUnitLevels/utils';
import MESSAGES from '../messages';
import { PageMode, Planning } from '../types';
import {
    convertAPIErrorsToState,
    SavePlanningQuery,
    useSavePlanning,
} from './requests/useSavePlanning';
import { usePlanningValidation } from './validation';

const toDatePickerFormat = (date?: string) =>
    date ? moment(date).format('L') : undefined;

// Pipelines and target types aren't edited in the form, so they are only sent when duplicating.
const getDuplicateOnlyValues = (
    planning: Planning,
    formatMessage: FormatMessage,
): Partial<SavePlanningQuery> => ({
    name: formatMessage(MESSAGES.duplicatedPlanningName, {
        name: planning.name,
    }),
    publishingStatus: 'draft',
    pipelineUuids: planning.pipeline_uuids,
    targetOrgUnitTypes: (planning.target_org_unit_type_details ?? []).map(
        type => type.id,
    ),
});

export const usePlanningForm = (
    planning: Planning | undefined,
    savedConfigs: SavedPlanningConfig[],
    mode: PageMode,
) => {
    const { formatMessage } = useSafeIntl();
    const { tab } = useParamsObject(baseUrls.planningDetails);
    const redirectToReplace = useRedirectToReplace();
    const onSaveSuccess = useCallback(
        (result: Planning) => {
            if (mode !== 'edit') {
                redirectToReplace(baseUrls.planningDetails, {
                    mode: 'edit',
                    planningId: `${result.id}`,
                    tab,
                });
            }
        },
        [mode, redirectToReplace, tab],
    );
    const { mutateAsync: savePlanning } = useSavePlanning({
        type: mode,
        savedConfigs,
    });
    const {
        apiErrors,
        payload,
        mutation: save,
    } = useApiErrorValidation<Partial<SavePlanningQuery>, Planning>({
        mutationFn: savePlanning,
        onSuccess: onSaveSuccess,
        convertError: convertAPIErrorsToState,
    });
    const schema = usePlanningValidation(apiErrors, payload);

    const initialValues: Partial<SavePlanningQuery> = {
        id: planning?.id,
        name: planning?.name,
        startDate: toDatePickerFormat(planning?.started_at),
        endDate: toDatePickerFormat(planning?.ended_at),
        project: planning?.project_details?.id,
        description: planning?.description,
        publishingStatus: planning?.published_at ? 'published' : 'draft',
        missions: planning?.missions,
        selectedOrgUnit: planning?.org_unit_details?.id,
        selectedTeam: planning?.team_details?.id,
        levels: configsToLevels(savedConfigs),
    };

    return useFormik({
        initialValues:
            mode === 'copy' && planning
                ? {
                      ...initialValues,
                      ...getDuplicateOnlyValues(planning, formatMessage),
                  }
                : initialValues,
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema: schema,
        onSubmit: save,
    });
};

export type PlanningFormik = ReturnType<typeof usePlanningForm>;
