import React, {
    FunctionComponent,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from 'react';

import {
    QueryBuilderFields,
    useHumanReadableJsonLogic,
    useSafeIntl,
} from 'bluesquare-components';
import { useDynamicFormDescriptors } from 'Iaso/domains/forms/fields/hooks/useGetFormDescriptor';
import { getQueryBuildersFields } from 'Iaso/domains/forms/fields/hooks/useGetQueryBuildersFields';
import { useDynamicPossibleFields } from 'Iaso/domains/forms/hooks/useGetPossibleFields';
import { Popper } from '../../../forms/fields/components/Popper';
import { useGetQueryBuilderListToReplace } from '../../../forms/fields/hooks/useGetQueryBuilderListToReplace';
import { parseJson } from '../../../instances/utils/jsonLogicParse';
import { useGetForms } from '../../entityTypes/hooks/requests/forms';
import MESSAGES from '../../messages';
import { BuilderDialog } from './BuilderDialog';
import {
    parseInitialLogic,
    getAllFields,
    LogicOperator,
    FormState,
    defaultFormState,
} from './utils';

type Props = {
    fieldsSearchJson: Record<string, any>;
    handleChange: (key: string, value?: string) => void;
};

export const EntitiesQueryBuilder: FunctionComponent<Props> = ({
    fieldsSearchJson,
    handleChange,
}) => {
    const { data: formsList, isFetching: isFetchingForms } = useGetForms(true);
    const [allFields, setAllFields] = useState<QueryBuilderFields>({});
    const [not, setNot] = useState(false);
    const [activeOperator, setActiveOperator] = useState<'and' | 'or' | null>(
        'and',
    );
    const [formStates, setFormStates] = useState<FormState[]>([]);
    const { descriptorsMap, isFetching: isFetchingDescriptors } =
        useDynamicFormDescriptors(formStates || []);
    const { possibleFieldsMap, isFetching: isFetchingPossibleFields } =
        useDynamicPossibleFields(formStates || []);

    const isFetching =
        isFetchingForms ||
        isFetchingDescriptors ||
        isFetchingPossibleFields ||
        formStates?.length !== Object.keys(allFields).length;
    useEffect(() => {
        if (fieldsSearchJson && formsList && formStates.length === 0) {
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

    const handleOperatorChange = useCallback((operator: 'and' | 'or') => {
        setActiveOperator(prev => {
            if (prev === operator) {
                return null;
            }
            return operator;
        });
    }, []);

    const handleNotChange = useCallback(() => {
        setNot(prev => !prev);
    }, []);

    const updateFormState = (index: number, field: string, value: any) => {
        setFormStates(prev => {
            const updated = [...(prev || [])];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };
    const { formatMessage } = useSafeIntl();

    // Memoize the field generation to prevent infinite loops
    const generatedFields = useMemo(() => {
        if (!formStates || formStates?.length === 0) return {};
        const newAllFields: QueryBuilderFields = {};

        formStates.forEach(formState => {
            const formId = formState.form?.id;
            const formIdString = formState.form?.form_id;

            if (formId && formIdString) {
                const possibleFields = possibleFieldsMap.get(formId);
                const formDescriptors = descriptorsMap.get(formId);

                if (possibleFields && formDescriptors) {
                    const subfields = getQueryBuildersFields(
                        formatMessage,
                        formDescriptors,
                        possibleFields,
                    );

                    newAllFields[formIdString] = {
                        label: formState.form.form_name || '',
                        type: '!group',
                        mode: 'array',
                        conjunctions: ['AND', 'OR'],
                        operators: ['some', 'all', 'none'],
                        defaultOperator: 'some',
                        subfields,
                    };
                }
            }
        });

        return newAllFields;
    }, [formStates, descriptorsMap, possibleFieldsMap, formatMessage]);

    useEffect(() => {
        if (JSON.stringify(allFields) !== JSON.stringify(generatedFields)) {
            setAllFields(generatedFields);
        }
    }, [generatedFields, allFields]);

    const handleChangeForm = useCallback(
        (newFormId: string, index: number) => {
            const form = formsList?.find(t => t.form_id === newFormId);
            const newFormState = {
                form: {
                    id: form?.id,
                    form_name: form?.name,
                    form_id: form?.form_id,
                },
                logic: undefined,
                operator: undefined,
                fields: undefined,
            };
            setFormStates(prev => {
                const updated = [...(prev || [])];
                updated[index] = newFormState;
                return updated;
            });
        },
        [formsList],
    );

    const handleDeleteForm = useCallback((index: number) => {
        setFormStates(prev => {
            const updated = [...(prev || [])];
            updated.splice(index, 1);
            return updated;
        });
    }, []);

    const handleAddForm = () => {
        setFormStates(prev => [...(prev || []), defaultFormState]);
    };

    const queryBuilderListToReplace = useGetQueryBuilderListToReplace();
    const getHumanReadableJsonLogic = useHumanReadableJsonLogic(
        isFetching ? {} : allFields,
        queryBuilderListToReplace,
    );

    const handleReset = useCallback(() => {
        setFormStates([]);
        setAllFields({});
        setNot(false);
        setActiveOperator(null);
        handleChange('fieldsSearch', undefined);
    }, [handleChange]);

    const handleChangeQueryBuilder = useCallback(
        value => {
            if (value) {
                const parsedValue = parseJson({ value, fields: allFields });
                handleChange('fieldsSearch', JSON.stringify(parsedValue));
            } else {
                handleReset();
            }
        },
        [allFields, handleChange, handleReset],
    );
    const value = useMemo(() => {
        if (fieldsSearchJson && !isFetching) {
            return getHumanReadableJsonLogic(fieldsSearchJson) as string;
        }
        return '';
    }, [fieldsSearchJson, getHumanReadableJsonLogic, isFetching]);
    if (!formsList) return null;
    return (
        <BuilderDialog
            onChange={handleChangeQueryBuilder}
            setAllFields={setAllFields}
            iconProps={{
                label: MESSAGES.queryBuilder,
                value,
                onClear: handleReset,
            }}
            InfoPopper={<Popper />}
            not={not}
            activeOperator={activeOperator}
            formStates={formStates || []}
            handleOperatorChange={handleOperatorChange}
            handleNotChange={handleNotChange}
            updateFormState={updateFormState}
            handleDeleteForm={handleDeleteForm}
            handleAddForm={handleAddForm}
            formsList={formsList}
            isFetchingForms={isFetchingForms}
            handleChangeForm={handleChangeForm}
            allFields={allFields}
        />
    );
};
