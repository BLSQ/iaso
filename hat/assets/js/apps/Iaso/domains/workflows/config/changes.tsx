/* eslint-disable camelcase */
import React from 'react';
import { useSafeIntl, IconButton } from 'bluesquare-components';

import MESSAGES from '../messages';
import { DateCell } from '../../../components/Cells/DateTimeCell';
import { LinkToForm } from '../../forms/components/LinkToForm';
import { ChangesActionCell } from '../components/changes/ActionCell';
import { TargetCell } from '../components/changes/TargetCell';
import { SourceCell } from '../components/changes/SourceCell';
import { MappingCell } from '../components/changes/MappingCell';
import { HeadTargetCell } from '../components/changes/HeadTargetCell';
import { HeadSourceCell } from '../components/changes/HeadSourceCell';

import { IntlFormatMessage } from '../../../types/intl';
import { Column } from '../../../types/table';
import {
    WorkflowVersionDetail,
    ChangesOption,
    Mapping,
    Change,
    ReferenceForm,
} from '../types';
import { PossibleField } from '../../forms/types/forms';
import { FormVersion } from '../../forms/hooks/useGetPossibleFields';
import { DropdownOptions } from '../../../types/utils';

export const useGetChangesColumns = (
    versionId: string,
    targetPossibleFields?: PossibleField[],
    targetPossibleFieldsByVersion?: FormVersion[],
    workflowVersion?: WorkflowVersionDetail,
    changes?: Change[],
): Array<Column> => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const columns: Array<Column> = [
        {
            Header: formatMessage(MESSAGES.form),
            id: 'form__name',
            accessor: 'form__name',
            Cell: settings => {
                return (
                    <LinkToForm
                        formId={settings.row.original.form.id}
                        formName={settings.row.original.form.name}
                    />
                );
            },
        },
        {
            Header: formatMessage(MESSAGES.mapping),
            id: 'mapping',
            accessor: 'mapping',
            Cell: settings => (
                <MappingCell mapping={settings.row.original.mapping} />
            ),
        },
        {
            Header: formatMessage(MESSAGES.created_at),
            accessor: 'created_at',
            id: 'created_at',
            Cell: DateCell,
        },
        {
            Header: formatMessage(MESSAGES.updated_at),
            accessor: 'updated_at',
            id: 'updated_at',
            Cell: DateCell,
        },
    ];
    if (workflowVersion?.status === 'DRAFT') {
        columns.push({
            Header: formatMessage(MESSAGES.actions),
            resizable: false,
            sortable: false,
            accessor: 'id',
            Cell: settings => {
                const change = changes?.find(ch => ch.id === settings.value);
                return (
                    <>
                        {change && (
                            <ChangesActionCell
                                change={change}
                                versionId={versionId}
                                targetPossibleFields={targetPossibleFields}
                                targetPossibleFieldsByVersion={
                                    targetPossibleFieldsByVersion
                                }
                                referenceForm={workflowVersion?.reference_form}
                                changes={changes}
                            />
                        )}
                    </>
                );
            },
        });
    }
    return columns;
};

type Params = {
    sourceOptions: ChangesOption[];
    targetOptions: ChangesOption[];
    handleUpdate: (
        // eslint-disable-next-line no-unused-vars
        key: keyof Mapping,
        // eslint-disable-next-line no-unused-vars
        value: string,
        // eslint-disable-next-line no-unused-vars
        index: number,
    ) => void;
    // eslint-disable-next-line no-unused-vars
    handleDelete: (index: number) => void;
    mappingArray: Mapping[];
    isFetchingSourcePossibleFields: boolean;
    // eslint-disable-next-line no-unused-vars
    handleChangeForm: (_, value: string) => void;
    changes?: Change[];
    change?: Change;
    form?: number;
    // eslint-disable-next-line no-unused-vars
    handleChangeSourceVersion: (_, value: string) => void;
    sourceVersion: string;
    sourceVersionsDropdownOptions: DropdownOptions<string>[];
    // eslint-disable-next-line no-unused-vars
    handleChangeTargetVersion: (_, value: string) => void;
    targetVersion: string;
    targetVersionsDropdownOptions: DropdownOptions<string>[];
    referenceForm?: ReferenceForm;
};

export const useGetChangesModalColumns = ({
    sourceOptions,
    targetOptions,
    handleUpdate,
    handleDelete,
    mappingArray,
    isFetchingSourcePossibleFields,
    handleChangeForm,
    changes,
    change,
    form,
    handleChangeSourceVersion,
    sourceVersion,
    sourceVersionsDropdownOptions,
    handleChangeTargetVersion,
    targetVersion,
    targetVersionsDropdownOptions,
    referenceForm,
}: Params): Array<Column> => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    return [
        {
            Header: (
                <HeadSourceCell
                    handleChangeForm={handleChangeForm}
                    changes={changes}
                    change={change}
                    form={form}
                    handleChangeSourceVersion={handleChangeSourceVersion}
                    sourceVersion={sourceVersion}
                    sourceVersionsDropdownOptions={
                        sourceVersionsDropdownOptions
                    }
                />
            ),
            sortable: false,
            accessor: 'source',
            width: 400,
            Cell: settings => {
                const rowIndex: number = settings.row.index;
                return (
                    <SourceCell
                        sourceOptions={sourceOptions}
                        handleUpdate={handleUpdate}
                        rowIndex={rowIndex}
                        value={settings.value}
                        isFetchingSourcePossibleFields={
                            isFetchingSourcePossibleFields
                        }
                        mappingArray={mappingArray}
                    />
                );
            },
        },
        {
            Header: (
                <HeadTargetCell
                    handleChangeTargetVersion={handleChangeTargetVersion}
                    targetVersion={targetVersion}
                    targetVersionsDropdownOptions={
                        targetVersionsDropdownOptions
                    }
                    referenceForm={referenceForm}
                />
            ),
            sortable: false,
            accessor: 'target',
            width: 400,
            Cell: settings => {
                const rowIndex: number = settings.row.index;
                return (
                    <TargetCell
                        targetOptions={targetOptions}
                        sourceOptions={sourceOptions}
                        handleUpdate={handleUpdate}
                        rowIndex={rowIndex}
                        value={settings.value}
                        mappingArray={mappingArray}
                    />
                );
            },
        },
        {
            Header: formatMessage(MESSAGES.actions),
            accessor: 'id',
            sortable: false,
            resizable: false,
            width: 90,
            Cell: settings => {
                return (
                    <IconButton
                        iconSize="small"
                        onClick={() => handleDelete(settings.row.index)}
                        icon="delete"
                        tooltipMessage={MESSAGES.delete}
                    />
                );
            },
        },
    ];
};
