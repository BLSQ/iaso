import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { Box } from '@mui/material';
import { useRedirectTo, useSafeIntl } from 'bluesquare-components';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { ValidateButton } from 'Iaso/domains/instances/components/ValidationWorkflow/ValidateButton';
import { ValidationNodeRetrieveResponse } from 'Iaso/domains/validationWorkflowsConfiguration/types/validationNodes';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { useValidateNode } from '../../hooks/api';
import MESSAGES from '../../messages';
import { InstanceValidationParams } from '../../types';
import { getValidationStepContext } from '../../utils/getActiveSteps';
import { ValidationSectionPaper } from './ValidationSectionPaper';

type Props = {
    workflow: ValidationNodeRetrieveResponse | undefined;
    isLoadingWorkflow: boolean;
};

export const ApprovalForm: FunctionComponent<Props> = ({
    workflow,
    isLoadingWorkflow,
}) => {
    const { formatMessage } = useSafeIntl();
    const params = useParamsObject(
        baseUrls.instanceValidation,
    ) as InstanceValidationParams;
    const [comment, setComment] = useState<string>('');
    const { selectedStep, instanceId } = params ?? {};

    const { activeSteps, selectedNodeSlug } = useMemo(
        () => getValidationStepContext(workflow, selectedStep),
        [workflow, selectedStep],
    );
    const expectedNextStep =
        activeSteps.length > 0 ? activeSteps[activeSteps.length - 1].id : null;
    const isBypassStep =
        expectedNextStep != null &&
        selectedStep != null &&
        `${expectedNextStep}` !== selectedStep;

    const { mutateAsync: validateStep, isLoading } = useValidateNode();
    const redirectTo = useRedirectTo();
    const onSave = useCallback(() => {
        redirectTo(baseUrls.instanceDetail, { instanceId });
    }, [instanceId, redirectTo]);

    const canSubmit =
        !isLoadingWorkflow &&
        Boolean(selectedStep) &&
        (!isBypassStep || Boolean(selectedNodeSlug));

    const commonPayload = useMemo(
        () => ({
            instanceId,
            nodeId: selectedStep,
            comment,
            node: isBypassStep ? selectedNodeSlug : undefined,
        }),
        [comment, instanceId, isBypassStep, selectedNodeSlug, selectedStep],
    );
    const onApprove = useCallback(async () => {
        try {
            await validateStep({ ...commonPayload, approved: true });
            onSave();
        } catch {
            // useSnackMutation surfaces the error; no redirect
        }
    }, [commonPayload, onSave, validateStep]);

    const onReject = useCallback(async () => {
        try {
            await validateStep({ ...commonPayload, approved: false });
            onSave();
        } catch {
            // useSnackMutation surfaces the error; no redirect
        }
    }, [commonPayload, onSave, validateStep]);
    return (
        <>
            <ValidationSectionPaper withTopMargin>
                <InputComponent
                    type="textarea"
                    keyValue="comment"
                    onChange={(_, value) => setComment(value)}
                    labelString={formatMessage(MESSAGES.comment)}
                    disabled={!canSubmit || isLoading}
                    helperText={
                        !comment
                            ? formatMessage(MESSAGES.commentForRejection)
                            : undefined
                    }
                />
            </ValidationSectionPaper>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: theme => theme.spacing(2),
                }}
            >
                <ValidateButton
                    color="success"
                    buttonText={formatMessage(MESSAGES.approve)}
                    onClick={onApprove}
                    disabled={!canSubmit || isLoading}
                />
                <ValidateButton
                    color="error"
                    buttonText={formatMessage(MESSAGES.reject)}
                    onClick={onReject}
                    disabled={!canSubmit || !comment || isLoading}
                />
            </Box>
        </>
    );
};
