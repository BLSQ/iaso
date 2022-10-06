/* eslint-disable camelcase */
import { useSnackQuery } from '../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { Paginated } from '../../../../../../../hat/assets/js/apps/Iaso/types/table';
import { waitFor } from '../../../../../../../hat/assets/js/apps/Iaso/utils';
import { makePaginatedResponse, pageOneTemplate } from './utils';

export type BudgetStep = {
    id: number;
    created_at: string; // Date in string form
    created_by: string; /// created_by
    created_by_team: string;
    comment?: string;
    links?: { alias: string; url: string }[];
    files?: string[];
    amount?: number;
    transition_key: string; // (step name)
    transition_label: string; // (step name)
};

const mockBudgetEvents = [
    {
        id: 3,
        created_at: '2022-09-06T07:14:08.957908Z',
        created_by: 'Marty McFly',
        created_by_team: 'Team McFly',
        comment: 'Nobody calls me "chicken"',
        links: ['https://en.wikipedia.org/wiki/Marty_McFly'],
        files: [
            'https://media.giphy.com/media/RidYucyuHdCVghZyZy/giphy-downsized.gif',
            'https://media.giphy.com/media/RidYucyuHdCVghZyZy/giphy-downsized.gif',
        ],
        amount: 1000,
        transition_key: 'submit_to_rrt',
        transition_label: 'Submit to RRT',
        deleted_at: 'false', // deleted_at: string | null
    },
    {
        id: 4,
        created_at: '2022-09-04T07:11:08.957908Z',
        created_by: 'Emmett Brown',
        created_by_team: 'Team Verne',
        comment: 'Nom de Zeus',
        links: ['https://en.wikipedia.org/wiki/Emmett_Brown'],
        files: ['https://media.giphy.com/media/0DYipdNqJ5n4GYATKL/giphy.gif'],
        amount: 1050,
        transition_key: 'send_to_GPEI',
        transition_label: 'Send to GPEI',
        deleted_at: null,
    },
];

const getBudgetDetails = async (params): Promise<Paginated<BudgetStep>> => {
    const filteredParams = Object.entries(params).filter(
        // eslint-disable-next-line no-unused-vars
        ([_key, value]) => value !== undefined,
    );
    const queryString = new URLSearchParams(
        Object.fromEntries(filteredParams) as Record<string, any>,
    ).toString();
    console.log('query string', queryString);
    await waitFor(1000);
    const data = params.show_hidden
        ? mockBudgetEvents
        : mockBudgetEvents.filter(event => !event.deleted_at);
    const response = makePaginatedResponse<BudgetStep>({
        ...pageOneTemplate,
        dataKey: 'results',
        data,
    });
    return response;
};

export const useGetBudgetDetails = params => {
    return useSnackQuery({
        queryFn: () => getBudgetDetails(params),
        queryKey: ['budgetDetails', params],
    });
};
