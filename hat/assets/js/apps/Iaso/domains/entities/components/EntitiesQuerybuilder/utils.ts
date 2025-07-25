import { JsonLogicTree } from '@react-awesome-query-builder/mui';
import { QueryBuilderFields } from 'bluesquare-components';
import { Form } from 'Iaso/domains/forms/types/forms';

export const borderColor = 'rgba(0, 0, 0, 0.23)';
export type LogicOperator = 'and' | 'or';
export type NotState = boolean;

export type ShortForm = {
    id?: number;
    form_name?: string;
    form_id?: string;
};

export type FormState = {
    form: ShortForm;
    logic?: JsonLogicTree;
    operator?: string;
    fields?: QueryBuilderFields;
};
export const defaultFormState: FormState = {
    form: {
        id: undefined,
        form_name: undefined,
        form_id: undefined,
    },
    logic: undefined,
    operator: undefined,
};
export const operatorButtons = [
    {
        key: 'and',
        label: 'AND',
        alwaysVisible: false,
    },
    {
        key: 'or',
        label: 'OR',
        alwaysVisible: false,
    },
];
export const parseInitialLogic = (
    logicInput: Record<string, any>,
    formsList: Form[],
) => {
    const fallback = {
        parsedNot: false,
        mainOperator: 'and',
        parsedFormStates: [],
    };

    if (!logicInput) return fallback;

    let logic: any;
    try {
        logic =
            typeof logicInput === 'string'
                ? JSON.parse(logicInput)
                : logicInput;
    } catch {
        return fallback;
    }

    const parsedNot = Boolean(logic['!']);
    const logicToUse = logic['!'] || logic;

    let mainOperator: LogicOperator = 'and';
    let formLogics: any[] = [];
    if (logicToUse.and || logicToUse.or) {
        mainOperator = logicToUse.and ? 'and' : 'or';
        formLogics = logicToUse[mainOperator];
    } else if (logicToUse.some || logicToUse.all || logicToUse.none) {
        formLogics = [logicToUse];
    } else {
        return { parsedNot, mainOperator, parsedFormStates: [] };
    }
    const parsedFormStates = formLogics.map(formLogic => {
        const [operator, arr] = Object.entries(formLogic)[0];
        if (!Array.isArray(arr) || arr.length < 2) {
            return defaultFormState;
        }
        const [{ var: form_id }, innerLogic] = arr;
        const form = formsList.find(f => f.form_id === form_id);
        return {
            form: {
                id: form?.id,
                form_name: form?.name,
                form_id,
            },
            logic: innerLogic,
            operator,
        };
    });
    return { parsedNot, mainOperator, parsedFormStates };
};

export const getButtonStyles =
    (isActive: boolean, type: 'not' | 'and' | 'or') => (theme: any) => {
        const base = {
            position: 'relative' as const,
            top: theme.spacing(1),
            p: theme.spacing(0.5, 1),
            minWidth: 0,
        };
        if (type === 'not') {
            return {
                ...base,
                color: isActive ? 'white' : 'inherit',
                borderColor: isActive ? 'secondary.main' : borderColor,
                backgroundColor: isActive
                    ? theme.palette.error.main
                    : 'rgb(224, 224, 224)',
                '&:hover': {
                    borderColor: isActive ? 'secondary.main' : borderColor,
                    color: isActive ? theme.palette.error.main : 'inherit',
                },
            };
        }
        // AND/OR
        return {
            ...base,
            color: isActive ? theme.palette.primary.contrastText : 'inherit',
            borderColor: isActive ? 'primary.main' : borderColor,
            backgroundColor: isActive
                ? theme.palette.primary.main
                : 'rgb(224, 224, 224)',
            '&:hover': {
                borderColor: isActive ? 'primary.main' : borderColor,
                color: isActive ? theme.palette.primary.main : 'inherit',
            },
        };
    };
export const formsOperators = [
    {
        label: 'Some',
        value: 'some',
    },
    {
        label: 'All',
        value: 'all',
    },
    {
        label: 'None',
        value: 'none',
    },
];
export const getAllFields = (formStates: FormState[]) => {
    const allFields = {};
    formStates.forEach(fs => {
        if (fs.fields && fs.form.form_id) {
            allFields[fs.form.form_id] = {
                label: fs.form.form_name || '',
                type: '!group',
                mode: 'array',
                conjunctions: ['AND', 'OR'],
                operators: ['some', 'all', 'none'],
                defaultOperator: 'some',
                subfields: fs.fields,
            };
        }
    });
    return allFields;
};
