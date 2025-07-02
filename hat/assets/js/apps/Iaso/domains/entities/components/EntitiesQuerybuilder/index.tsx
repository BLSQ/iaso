import React, { FunctionComponent, useState, useEffect } from 'react';

import {
    QueryBuilderFields,
    useHumanReadableJsonLogic,
} from 'bluesquare-components';
import { Popper } from '../../../forms/fields/components/Popper';
import { useGetQueryBuilderListToReplace } from '../../../forms/fields/hooks/useGetQueryBuilderListToReplace';
import { parseJson } from '../../../instances/utils/jsonLogicParse';
import { useGetForms } from '../../entityTypes/hooks/requests/forms';
import MESSAGES from '../../messages';
import { DialogBuilder } from './DialogBuilder';
import {
    parseInitialLogic,
    getAllFields,
    LogicOperator,
    FormState,
    defaultFormState,
} from './utils';

type Props = {
    fieldsSearchJson: string;
    handleChange: (key: string, value?: string) => void;
};

export const EntitiesQueryBuilder: FunctionComponent<Props> = ({
    fieldsSearchJson,
    handleChange,
}) => {
    const { data: formsList, isFetching: isFetchingForms } = useGetForms(true);
    // Load QueryBuilder resources
    const [allFields, setAllFields] = useState<QueryBuilderFields>({});

    // LIFTED STATE
    const [not, setNot] = useState(false);
    const [activeOperator, setActiveOperator] = useState<'and' | 'or' | null>(
        'and',
    );
    const [formStates, setFormStates] = useState<FormState[] | undefined>();
    console.log('formStates', formStates);
    // LIFTED EFFECT FOR INITIAL LOGIC
    useEffect(() => {
        if (fieldsSearchJson && formsList && !formStates) {
            const { parsedNot, mainOperator, parsedFormStates } =
                parseInitialLogic(fieldsSearchJson, formsList);
            setNot(parsedNot);
            setActiveOperator(mainOperator as LogicOperator);
            const newFormStates = parsedFormStates.length
                ? parsedFormStates
                : [defaultFormState];
            setAllFields(getAllFields(newFormStates));
            setFormStates(newFormStates);
        }
    }, [fieldsSearchJson, formsList, formStates]);

    // LIFTED HANDLERS
    const handleOperatorChange = React.useCallback((operator: 'and' | 'or') => {
        setActiveOperator(prev => {
            if (prev === operator) {
                return null;
            }
            return operator;
        });
    }, []);

    const handleNotChange = React.useCallback(() => {
        setNot(prev => !prev);
    }, []);

    const updateFormState = React.useCallback(
        (index: number, field: string, value: any) => {
            setFormStates(prev => {
                const updated = [...(prev || [])];
                updated[index] = { ...updated[index], [field]: value };
                return updated;
            });
        },
        [],
    );

    const handleDeleteForm = React.useCallback((index: number) => {
        setFormStates(prev => {
            const updated = [...(prev || [])];
            updated.splice(index, 1);
            return updated;
        });
    }, []);

    const handleAddForm = React.useCallback(() => {
        setFormStates(prev => [...(prev || []), defaultFormState]);
    }, []);

    const queryBuilderListToReplace = useGetQueryBuilderListToReplace();
    const getHumanReadableJsonLogic = useHumanReadableJsonLogic(
        allFields,
        queryBuilderListToReplace,
    );

    const handleChangeQueryBuilder = value => {
        if (value) {
            const parsedValue = parseJson({ value, fields: allFields });
            handleChange('fieldsSearch', JSON.stringify(parsedValue));
        } else {
            handleChange('fieldsSearch', undefined);
        }
    };
    if (!formsList) return null;
    return (
        <DialogBuilder
            onChange={handleChangeQueryBuilder}
            setAllFields={setAllFields}
            initialLogic={fieldsSearchJson}
            iconProps={{
                label: MESSAGES.queryBuilder,
                value: fieldsSearchJson
                    ? (getHumanReadableJsonLogic(fieldsSearchJson) as string)
                    : '',
                onClear: () => handleChange('fieldsSearch', undefined),
            }}
            InfoPopper={<Popper />}
            // Pass lifted state and handlers
            not={not}
            setNot={setNot}
            activeOperator={activeOperator}
            setActiveOperator={setActiveOperator}
            formStates={formStates || []}
            setFormStates={setFormStates}
            handleOperatorChange={handleOperatorChange}
            handleNotChange={handleNotChange}
            updateFormState={updateFormState}
            handleDeleteForm={handleDeleteForm}
            handleAddForm={handleAddForm}
            formsList={formsList}
            isFetchingForms={isFetchingForms}
        />
    );
};
