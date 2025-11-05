import React, { FunctionComponent, useCallback, useMemo } from 'react';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { useGetOrgUnitsByOrgUnitTypeId } from 'Iaso/domains/assignments/hooks/requests/useGetOrgUnits';
import { Planning } from 'Iaso/domains/assignments/types/planning';
import MESSAGES from '../../messages';
import { ParameterValues } from './LQASForm';

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
    const excludedOrgUnitIds =
        index > 0
            ? parameterValues?.org_unit_type_exceptions
                  ?.slice(0, index)
                  ?.filter(e => Boolean(e))
                  .join(',')
            : undefined;
    const { data: orgUnits, isFetching: isFetchingOrgUnits } =
        useGetOrgUnitsByOrgUnitTypeId({
            orgUnitTypeId,
            projectId: planning.project,
            excludedOrgUnitParentIds: excludedOrgUnitIds || undefined,
        });

    const handleExcludedOrgUnitsChange = useCallback(
        (value: string) => {
            const currentArray =
                parameterValues?.org_unit_type_exceptions || [];
            const updatedArray = [...currentArray];
            updatedArray[index] = value;
            handleParameterChange('org_unit_type_exceptions', updatedArray);
        },
        [
            handleParameterChange,
            index,
            parameterValues?.org_unit_type_exceptions,
        ],
    );
    const options = useMemo(
        () =>
            orgUnits?.map(ou => ({
                label: ou.name,
                value: ou.id,
            })),
        [orgUnits],
    );
    return (
        <InputComponent
            type="select"
            multi
            disabled={isFetchingOrgUnits || !orgUnitTypeId}
            withMarginTop={false}
            label={MESSAGES.excludedOrgUnits}
            keyValue="orgUnitId"
            value={selectedOrgUnitIds}
            loading={isFetchingOrgUnits}
            options={options}
            onChange={(_, value) => {
                handleExcludedOrgUnitsChange(value);
            }}
        />
    );
};
