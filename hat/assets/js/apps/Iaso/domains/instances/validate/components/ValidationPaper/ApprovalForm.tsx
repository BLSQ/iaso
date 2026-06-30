import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { Box, Paper } from '@mui/material';
import {
    LoadingSpinner,
    UrlParams,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { ValidateButton } from 'Iaso/domains/instances/components/ValidationWorkflow/ValidateButton';
import {
    Timeline,
    ValidationNodeRetrieveResponse,
} from 'Iaso/domains/validationWorkflowsConfiguration/types/validationNodes';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { useValidateNode } from '../../hooks/api';
import MESSAGES from '../../messages';

type Props = {
    workflow: ValidationNodeRetrieveResponse | undefined;
};

type Params = {
    accountId: string;
    instanceId: string;
    selectedStep?: string;
} & Partial<UrlParams>;

export const ApprovalForm: FunctionComponent<Props> = ({ workflow }) => {
    const { formatMessage } = useSafeIntl();
    const params: Params = useParamsObject(
        baseUrls.instanceValidation,
    ) as Params;
    const [comment, setComment] = useState<string>('');
    const { selectedStep, instanceId } = params ?? {};

    const selectedNodeSlug =
        (workflow?.submissions?.[0].timeline ?? []).find(
            step => `${step.id}` === selectedStep,
        )?.node_template_slug ?? '';

    const activeSteps: Timeline[] = useMemo(() => {
        return (
            workflow?.submissions?.[0].timeline
                .filter((el: Timeline) => el.user_can_do_actions)
                .filter((el: Timeline) => el.status !== 'ACCEPTED') ?? []
        );
    }, [workflow]);
    const expectedNextStep =
        activeSteps.length > 0 ? activeSteps[activeSteps.length - 1].id : null;
    const isBypassStep = `${expectedNextStep}` !== selectedStep;

    const { mutateAsync: validateStep, isLoading } = useValidateNode();
    const redirectTo = useRedirectTo();
    const onSave = useCallback(() => {
        redirectTo(baseUrls.instanceDetail, { instanceId });
    }, [instanceId, redirectTo]);

    const commonPayload = useMemo(
        () => ({
            instanceId,
            nodeId: selectedStep,
            comment,
            node: isBypassStep ? selectedNodeSlug : undefined,
        }),
        [comment, instanceId, isBypassStep, selectedNodeSlug, selectedStep],
    );
    const onApprove = useCallback(() => {
        const body = {
            ...commonPayload,
            approved: true,
        };
        validateStep(body).then(onSave);
    }, [commonPayload, onSave, validateStep]);

    const onReject = useCallback(() => {
        const body = {
            ...commonPayload,
            approved: false,
        };
        validateStep(body).then(onSave);
    }, [commonPayload, onSave, validateStep]);
    return (
        <>
            {isLoading && <LoadingSpinner />}
            <Paper
                elevation={1}
                sx={{
                    padding: theme => theme.spacing(2),
                    margin: 0,
                    overflow: 'auto',
                    marginLeft: theme => theme.spacing(2),
                    marginRight: theme => theme.spacing(2),
                    marginTop: theme => theme.spacing(2),
                }}
            >
                <Box
                    sx={{
                        padding: theme => theme.spacing(2),
                    }}
                >
                    <InputComponent
                        type="textarea"
                        keyValue={'comment'}
                        onChange={(_, value) => setComment(value)}
                        labelString={formatMessage(MESSAGES.comment)}
                        helperText={
                            !comment
                                ? formatMessage(MESSAGES.commentForRejection)
                                : undefined
                        }
                    />
                </Box>
            </Paper>
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
                />
                <ValidateButton
                    color="error"
                    buttonText={formatMessage(MESSAGES.reject)}
                    onClick={onReject}
                    disabled={!comment}
                />
            </Box>
        </>
    );
};
