import React, { FunctionComponent, useCallback } from 'react';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { useGetOrgUnitsByOrgUnitTypeId } from 'Iaso/domains/assignments/hooks/requests/useGetOrgUnits';
import { Planning } from 'Iaso/domains/assignments/types/planning';
import { ParameterValues } from '../hooks/usePipelineParameters';
import { MESSAGES } from '../messages';

type Props = {
    index: number;
    orgUnitTypeId?: number;
    handleParameterChange: (parameterName: string, value: any) => void;
    selectedOrgUnitIds: number[];
    parameterValues?: ParameterValues;
    planning: Planning;
};

export const ExcludedOrgUnits: FunctionComponent<Props> = ({
    index,
    orgUnitTypeId,
    handleParameterChange,
    selectedOrgUnitIds,
    parameterValues,
    planning,
}) => {
    const { data: orgUnits, isFetching: isFetchingOrgUnits } =
        useGetOrgUnitsByOrgUnitTypeId({
            orgUnitTypeId,
            projectId: planning.project,
        });

    const handleExcludedOrgUnitsChange = useCallback(
        (value: string) => {
            const selectedOrgUnitIds =
                value?.split(',').map(id => parseInt(id, 10)) || [];
            const currentArray =
                parameterValues?.org_unit_type_exceptions || [];
            const updatedArray = [...currentArray];
            updatedArray[index] = selectedOrgUnitIds;
            handleParameterChange('org_unit_type_exceptions', updatedArray);
        },
        [
            handleParameterChange,
            index,
            parameterValues?.org_unit_type_exceptions,
        ],
    );
    return (
        <InputComponent
            type="select"
            multi
            withMarginTop={false}
            label={MESSAGES.excludedOrgUnits}
            keyValue="orgUnitId"
            value={selectedOrgUnitIds}
            loading={isFetchingOrgUnits}
            options={orgUnits?.map(ou => ({
                label: ou.name,
                value: ou.id,
            }))}
            onChange={(_, value) => {
                handleExcludedOrgUnitsChange(value);
            }}
        />
    );
};
