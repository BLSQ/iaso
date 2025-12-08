export const defaultLogic = { and: [{ '>=': [{ var: 'value' }, 0] }] };

export const queryBuilderFields = {
    value: {
        type: 'number',
        queryBuilder: {
            type: 'number',
            operators: [
                'equal',
                'greater',
                'less',
                'greater_or_equal',
                'less_or_equal',
            ],
            preferWidgets: ['number'],
        },
    },
};
