import React, {
    FunctionComponent,
    Dispatch,
    SetStateAction,
    useCallback,
    useMemo,
} from 'react';
import { Box, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { LQASForm } from 'Iaso/domains/assignments/sampling/customForms/LQASForm';
import { Parameters } from 'Iaso/domains/openHexa/components/Parameters';
import { useGetPipelineConfig } from 'Iaso/domains/openHexa/hooks/useGetPipelineConfig';
import { useGetPipelinesDropdown } from 'Iaso/domains/openHexa/hooks/useGetPipelines';
import {
    ParameterValues,
    Pipeline,
} from 'Iaso/domains/openHexa/types/pipeline';

import { OrgUnitTypeHierarchyDropdownValues } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';

import { TaskStatus } from 'Iaso/domains/tasks/types';
import MESSAGES from '../../messages';
import { Planning } from '../../types/planning';

type Props = {
    planning: Planning;
    selectedPipelineId?: string;
    handleChangePipeline: (key: string, value: any) => void;
    pipeline?: Pipeline;
    parameterValues?: ParameterValues;
    setParameterValues: (values: ParameterValues) => void;
    orgunitTypes: OrgUnitTypeHierarchyDropdownValues;
    isFetchingOrgunitTypes: boolean;
    setExtraFilters: Dispatch<SetStateAction<Record<string, any>>>;
    setAllowConfirm: React.Dispatch<React.SetStateAction<boolean>>;
    taskStatus?: TaskStatus;
    taskId?: number;
};

export const PipelineSelect: FunctionComponent<Props> = ({
    planning,
    selectedPipelineId,
    handleChangePipeline,
    pipeline,
    parameterValues,
    setParameterValues,
    setAllowConfirm,
    orgunitTypes,
    isFetchingOrgunitTypes,
    setExtraFilters,
    taskStatus,
    taskId,
}) => {
    const { data: config } = useGetPipelineConfig();
    const { formatMessage } = useSafeIntl();
    const { data, isFetching: isFetchingPipelineUuids } =
        useGetPipelinesDropdown();

    const lQAS_code = config?.lqas_pipeline_code;
    const pipelineUuidsOptions = useMemo(
        () =>
            data?.filter(pipeline =>
                planning.pipeline_uuids.includes(pipeline.value),
            ),
        [data, planning.pipeline_uuids],
    );

    const handleParameterChange = useCallback(
        (parameterName: string, value: any) => {
            setParameterValues?.(prev => ({
                ...prev,
                [parameterName]: value,
            }));
        },
        [setParameterValues],
    );
    return (
        <Box>
            <InputComponent
                type="select"
                keyValue="pipeline"
                loading={isFetchingPipelineUuids}
                options={pipelineUuidsOptions}
                value={isFetchingPipelineUuids ? undefined : selectedPipelineId}
                onChange={handleChangePipeline}
                label={MESSAGES.pipeline}
                required
                disabled={
                    isFetchingPipelineUuids ||
                    planning.pipeline_uuids.length === 1
                }
            />
            {pipeline && (
                <>
                    {!pipeline.currentVersion?.parameters && (
                        <Typography variant="body2">
                            {formatMessage(MESSAGES.noParameters)}
                        </Typography>
                    )}
                    {pipeline.code === lQAS_code && (
                        <LQASForm
                            planning={planning}
                            setAllowConfirm={setAllowConfirm}
                            parameterValues={parameterValues}
                            handleParameterChange={handleParameterChange}
                            orgunitTypes={orgunitTypes}
                            isFetchingOrgunitTypes={isFetchingOrgunitTypes}
                            taskStatus={taskStatus ?? 'QUEUED'}
                            setExtraFilters={setExtraFilters}
                            taskId={taskId}
                        />
                    )}
                    {pipeline.code !== lQAS_code && (
                        <Parameters
                            parameters={pipeline.currentVersion?.parameters}
                            parameterValues={parameterValues}
                            setParameterValues={setParameterValues}
                            setAllowConfirm={setAllowConfirm}
                        />
                    )}
                </>
            )}
        </Box>
    );
};
