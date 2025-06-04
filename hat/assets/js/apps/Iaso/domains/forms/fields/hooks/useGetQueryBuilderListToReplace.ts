import { QueryBuilderListToReplace } from 'bluesquare-components';
import { blue, purple, green, red } from '@mui/material/colors';

export const useGetQueryBuilderListToReplace =
    (): QueryBuilderListToReplace[] => {
        return [
            {
                color: purple[700],
                items: ['AND', 'OR'],
            },
            {
                color: green[700],
                items: ['SOME OF', 'ALL OF', 'HAVE'],
            },
            {
                color: red[700],
                items: ['NONE OF'],
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
