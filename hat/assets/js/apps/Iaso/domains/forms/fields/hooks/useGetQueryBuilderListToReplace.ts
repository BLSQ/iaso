import { QueryBuilderListToReplace } from 'bluesquare-components';
import { purple, blue } from '@material-ui/core/colors';

export const useGetQueryBuilderListToReplace =
    (): QueryBuilderListToReplace[] => {
        return [
            {
                color: purple[700],
                items: ['AND', 'OR'],
            },
            {
                color: blue[700],
                items: [
                    '=',
                    '!=',
                    'IS NULL',
                    'IS NOT NULL',
                    '>',
                    '<',
                    '>=',
                    '<=',
                ],
            },
        ];
    };
