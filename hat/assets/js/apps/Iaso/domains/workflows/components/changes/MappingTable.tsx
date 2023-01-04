import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    SetStateAction,
    Dispatch,
} from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    Table,
    // @ts-ignore
    AddButton,
    // @ts-ignore
    IconButton,
} from 'bluesquare-components';
import { Box, makeStyles } from '@material-ui/core';
import { cloneDeep } from 'lodash';

import { Mapping } from '../../types';
import { Column } from '../../../../types/table';
import { IntlFormatMessage } from '../../../../types/intl';
import InputComponent from '../../../../components/forms/InputComponent';

import MESSAGES from '../../messages';
import { PossibleField } from '../../../forms/types/forms';

type Props = {
    mappings: Mapping[];
    setMappings: Dispatch<SetStateAction<Mapping[]>>;
    sourcePossibleFields: PossibleField[];
    targetPossibleFields: PossibleField[];
    isFetchingSourcePossibleFields: boolean;
    form?: number;
};
const useStyles = makeStyles(theme => ({
    tableContainer: {
        maxHeight: '60vh',
        overflow: 'auto',
        // @ts-ignore
        borderTop: `1px solid ${theme.palette.ligthGray.border}`,
        // @ts-ignore
        borderLeft: `1px solid ${theme.palette.ligthGray.border}`,
        // @ts-ignore
        borderRight: `1px solid ${theme.palette.ligthGray.border}`,
        '& table tbody tr td': {
            '& label': {
                opacity: 0,
            },
            '& legend': {
                width: 0,
            },
            '& .MuiAutocomplete-inputRoot[class*="MuiOutlinedInput-root"]': {
                paddingTop: 0,
                paddingBottom: 0,
            },
            '& .MuiFormControl-fullWidth': {
                backgroundColor: 'white',
            },
            '& .MuiFormControl-root .MuiBox-root ': {
                display: 'none',
            },
        },
    },
}));

export const MappingTable: FunctionComponent<Props> = ({
    mappings,
    setMappings,
    sourcePossibleFields,
    targetPossibleFields,
    isFetchingSourcePossibleFields,
    form,
}) => {
    const classes = useStyles();
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();

    const handleUpdate = useCallback(
        (key: 'target' | 'source', value: string, index: number) => {
            const newMappings = cloneDeep(mappings);
            newMappings[index] = {
                ...newMappings[index],
                [key]: value,
            };
            setMappings(newMappings);
        },
        [mappings, setMappings],
    );
    const handleAdd = useCallback(() => {
        const newMappings = cloneDeep(mappings);
        newMappings.push({
            target: undefined,
            source: undefined,
        });
        setMappings(newMappings);
    }, [mappings, setMappings]);

    const handleDelete = useCallback(
        (index: number) => {
            const newMappings = cloneDeep(mappings).splice(index + 1, 1);
            setMappings(newMappings);
        },
        [mappings, setMappings],
    );

    const sourceOptions = useMemo(
        () =>
            sourcePossibleFields.map(field => ({
                label: field.label,
                value: field.fieldKey,
            })),
        [sourcePossibleFields],
    );
    const targetOptions = useMemo(
        () =>
            targetPossibleFields.map(field => ({
                label: field.label,
                value: field.fieldKey,
            })),
        [targetPossibleFields],
    );

    const columns: Column[] = [
        {
            Header: formatMessage(MESSAGES.source),
            sortable: false,
            accessor: 'source',
            Cell: settings => {
                return (
                    <InputComponent
                        withMarginTop={false}
                        type="select"
                        keyValue="source"
                        onChange={(_, value) =>
                            handleUpdate('source', value, settings.row.index)
                        }
                        value={
                            !isFetchingSourcePossibleFields
                                ? settings.value
                                : undefined
                        }
                        labelString=""
                        required
                        options={sourceOptions}
                    />
                );
            },
        },
        {
            Header: formatMessage(MESSAGES.target),
            sortable: false,
            accessor: 'target',
            Cell: settings => {
                return (
                    <InputComponent
                        withMarginTop={false}
                        type="select"
                        keyValue="target"
                        onChange={(_, value) =>
                            handleUpdate('target', value, settings.row.index)
                        }
                        value={settings.value}
                        labelString=""
                        required
                        options={targetOptions}
                    />
                );
            },
        },
        {
            Header: formatMessage(MESSAGES.actions),
            accessor: 'id',
            sortable: false,
            resizable: false,
            width: 50,
            Cell: settings => {
                return (
                    <IconButton
                        onClick={() => handleDelete(settings.row.index)}
                        icon="delete"
                        tooltipMessage={MESSAGES.delete}
                    />
                );
            },
        },
    ];
    return (
        <>
            <Box className={classes.tableContainer}>
                <Table
                    data={mappings}
                    showPagination={false}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    marginBottom={false}
                    marginTop={false}
                    columns={columns}
                    countOnTop={false}
                    count={mappings?.length ?? 0}
                    extraProps={{
                        targetPossibleFields,
                        columns,
                    }}
                />
            </Box>
            {form && (
                <Box display="flex" justifyContent="flex-end" mt={2}>
                    <AddButton onClick={handleAdd} />
                </Box>
            )}
        </>
    );
};
