import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    SetStateAction,
    Dispatch,
} from 'react';
import { useSafeIntl, Table, AddButton } from 'bluesquare-components';
import { Box, makeStyles } from '@material-ui/core';
import { cloneDeep } from 'lodash';

import { Mapping, ChangesOption, Change, ReferenceForm } from '../../types';
import { DropdownOptions } from '../../../../types/utils';
import { IntlFormatMessage } from '../../../../types/intl';

import MESSAGES from '../../messages';
import { PossibleField } from '../../../forms/types/forms';

import { useGetChangesModalColumns } from '../../config/changes';

import { formatLabel } from '../../../instances/utils';

type Props = {
    mappingArray: Mapping[];
    setMappingArray: Dispatch<SetStateAction<Mapping[]>>;
    sourcePossibleFields: PossibleField[];
    targetPossibleFields: PossibleField[];
    isFetchingSourcePossibleFields: boolean;
    form?: number;
    setIsTouched: Dispatch<SetStateAction<boolean>>;
    // eslint-disable-next-line no-unused-vars
    handleChangeForm: (_, value: string) => void;
    changes?: Change[];
    change?: Change;
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

const useGetOptions = () => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const getOptions = (possibleFields: PossibleField[]): ChangesOption[] =>
        possibleFields.map(field => ({
            label: `${formatLabel(field)} - ID: ${
                field.fieldKey
            } - ${formatMessage(MESSAGES.type)}: ${field.type}`,
            value: field.fieldKey,
            type: field.type,
        }));
    return getOptions;
};

export const MappingTable: FunctionComponent<Props> = ({
    mappingArray,
    setMappingArray,
    sourcePossibleFields,
    targetPossibleFields,
    isFetchingSourcePossibleFields,
    form,
    setIsTouched,
    handleChangeForm,
    changes,
    change,
    handleChangeSourceVersion,
    sourceVersion,
    sourceVersionsDropdownOptions,
    handleChangeTargetVersion,
    targetVersion,
    targetVersionsDropdownOptions,
    referenceForm,
}) => {
    const classes = useStyles();
    const getOptions = useGetOptions();

    const handleUpdate = useCallback(
        (key: keyof Mapping, value: string | undefined, index: number) => {
            const newMappings = cloneDeep(mappingArray);
            newMappings[index] = {
                ...newMappings[index],
                [key]: value,
            };
            // remove target if source is not of the same type
            if (key === 'source') {
                const target = targetPossibleFields.find(
                    possibleField =>
                        possibleField.fieldKey === mappingArray[index].target,
                );
                const source = sourcePossibleFields.find(
                    possibleField => possibleField.fieldKey === value,
                );
                if (target?.type !== source?.type) {
                    newMappings[index].target = undefined;
                }
            }
            setIsTouched(true);
            setMappingArray(newMappings);
        },
        [
            mappingArray,
            setIsTouched,
            setMappingArray,
            sourcePossibleFields,
            targetPossibleFields,
        ],
    );

    const handleAdd = useCallback(() => {
        const newMappings = cloneDeep(mappingArray);
        newMappings.push({
            target: undefined,
            source: undefined,
        });
        setIsTouched(true);
        setMappingArray(newMappings);
    }, [mappingArray, setIsTouched, setMappingArray]);

    const handleDelete = useCallback(
        (index: number) => {
            const newMappings = cloneDeep(mappingArray);
            newMappings.splice(index, 1);
            setIsTouched(true);
            setMappingArray(newMappings);
        },
        [mappingArray, setIsTouched, setMappingArray],
    );

    const sourceOptions = useMemo(
        () => getOptions(sourcePossibleFields),
        [getOptions, sourcePossibleFields],
    );

    const targetOptions = useMemo(
        () => getOptions(targetPossibleFields),
        [getOptions, targetPossibleFields],
    );

    const columns = useGetChangesModalColumns({
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
    });

    return (
        <>
            <Box className={classes.tableContainer}>
                <Table
                    data={mappingArray}
                    showPagination={false}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    marginBottom={false}
                    marginTop={false}
                    columns={columns}
                    countOnTop={false}
                    count={mappingArray?.length ?? 0}
                    extraProps={{
                        targetPossibleFields,
                        columns,
                    }}
                />
            </Box>
            {form && (
                <Box display="flex" justifyContent="flex-end" mt={2}>
                    <AddButton
                        onClick={handleAdd}
                        dataTestId="create-change-button"
                    />
                </Box>
            )}
        </>
    );
};
