import { JsonLogicTree } from '@react-awesome-query-builder/mui';

export const borderColor = 'rgba(0, 0, 0, 0.23)';
export type LogicOperator = 'and' | 'or';
export type NotState = boolean;

export type FormState = {
    form_id?: string;
    logic?: JsonLogicTree;
    operator?: string;
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
export const parseInitialLogic = (logicInput: any) => {
    let parsedNot = false;
    let logic = logicInput;
    if (!logic)
        return {
            parsedNot,
            mainOperator: 'and',
            parsedFormStates: [],
        };
    if (typeof logic === 'string') {
        try {
            logic = JSON.parse(logic);
        } catch {
            return {
                parsedNot,
                mainOperator: 'and',
                parsedFormStates: [],
            };
        }
    }
    if (logic['!']) {
        parsedNot = true;
        logic = logic['!'];
    }
    let mainOperator: LogicOperator = 'and';
    let formLogics: any[] = [];
    if (logic.and || logic.or) {
        mainOperator = logic.and ? 'and' : 'or';
        formLogics = logic[mainOperator];
    } else if (logic.some || logic.all || logic.none) {
        formLogics = [logic];
    } else {
        return { parsedNot, mainOperator, parsedFormStates: [] };
    }
    const parsedFormStates = formLogics.map(formLogic => {
        const [operator, arr] = Object.entries(formLogic)[0];
        if (!Array.isArray(arr) || arr.length < 2) {
            return {
                form_id: undefined,
                logic: undefined,
                operator: undefined,
            };
        }
        const [{ var: form_id }, innerLogic] = arr;
        return {
            form_id,
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
