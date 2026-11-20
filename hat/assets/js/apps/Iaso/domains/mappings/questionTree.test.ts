import { describe, expect, it } from 'vitest';
import {
    ALL_STATUSES,
    buildQuestionTree,
    countByStatus,
    filterQuestionTree,
    getFirstUnmappedNode,
    getGroupKeys,
    getMappingProgress,
    getSelectableNodes,
} from './questionTree';
import { QuestionStatus, QuestionTreeNode } from './types';

const descriptor = {
    name: 'survey',
    type: 'survey',
    children: [
        {
            name: 'belgium',
            type: 'group',
            label: 'Belgique',
            children: [
                { name: 'q1', type: 'integer', label: 'Population totale' },
                { name: 'q2', type: 'integer', label: 'Écoles' },
                {
                    name: 'brussels',
                    type: 'group',
                    label: 'Bruxelles',
                    children: [
                        { name: 'q3', type: 'integer', label: 'Hôpitaux' },
                        { name: 'q5', type: 'integer', label: 'Gares' },
                    ],
                },
            ],
        },
        {
            name: 'services',
            type: 'select all that apply',
            label: 'Services',
            children: [
                { name: 'water', label: 'Water' },
                { name: 'power', label: 'Power' },
            ],
        },
        { name: 'q4', type: 'text', label: 'France' },
    ],
};

const de = (id: string) => ({
    id,
    name: `DE ${id}`,
    valueType: 'NUMBER',
    categoryOptionCombo: 'coc',
    categoryOptionComboName: 'default',
});

const questionMappings = {
    q1: de('population'),
    q3: { type: 'neverMapped' },
    q5: de('stations'),
    services__water: de('water'),
};

const buildTree = () => buildQuestionTree(descriptor, questionMappings);

// "key status" of each node, nested like the tree, for readable diffs
type Shape = (string | Record<string, Shape>)[];
const shape = (nodes: QuestionTreeNode[]): Shape =>
    nodes.map(node =>
        node.children
            ? { [node.key]: shape(node.children) }
            : `${node.key} ${node.status}`,
    );

const keys = (nodes: QuestionTreeNode[]) =>
    getSelectableNodes(nodes).map(node => node.key);

describe('buildQuestionTree', () => {
    it('returns an empty tree without descriptor', () => {
        expect(buildQuestionTree(undefined, {})).toEqual([]);
    });

    it('nests the questions with their mapping status', () => {
        expect(shape(buildTree())).toEqual([
            {
                belgium: [
                    'q1 mapped',
                    'q2 unmapped',
                    { brussels: ['q3 never', 'q5 mapped'] },
                ],
            },
            {
                services: [
                    'services__water mapped',
                    'services__power unmapped',
                ],
            },
            'q4 unmapped',
        ]);
    });

    it('labels a mapped question with its DHIS2 target', () => {
        const [belgium] = buildTree();
        expect(belgium.children?.[0]).toMatchObject({
            label: 'Population totale',
            name: 'q1',
            target: 'DE population',
            selectable: true,
        });
        expect(belgium.children?.[1].target).toBeUndefined();
    });

    it('counts the mapped questions of a group, nested groups included, never mapped excluded', () => {
        const [belgium, services] = buildTree();
        expect(belgium).toMatchObject({ mappedCount: 2, questionsCount: 4 });
        expect(belgium.children?.[2]).toMatchObject({
            mappedCount: 1,
            questionsCount: 2,
        });
        expect(services).toMatchObject({ mappedCount: 1, questionsCount: 2 });
    });

    it('only lets questions be selected, not groups nor select all that apply', () => {
        expect(keys(buildTree())).toEqual([
            'q1',
            'q2',
            'q3',
            'q5',
            'services__water',
            'services__power',
            'q4',
        ]);
    });

    it('keeps a question name used in two groups once, as they share a mapping', () => {
        const tree = buildQuestionTree(
            {
                name: 'survey',
                type: 'survey',
                children: ['belgium', 'france'].map(group => ({
                    name: group,
                    type: 'group',
                    children: [
                        { name: 'population', type: 'integer' },
                        { name: `${group}_capital`, type: 'text' },
                    ],
                })),
            },
            {},
        );
        expect(keys(tree)).toEqual([
            'population',
            'belgium_capital',
            'france_capital',
        ]);
    });

    it('lets a repeat group be selected', () => {
        const tree = buildQuestionTree(
            {
                name: 'survey',
                type: 'survey',
                children: [
                    {
                        name: 'children',
                        type: 'repeat',
                        children: [{ name: 'age', type: 'integer' }],
                    },
                ],
            },
            {},
        );
        expect(keys(tree)).toEqual(['children', 'age']);
    });
});

describe('countByStatus', () => {
    it('counts the questions, not the groups', () => {
        expect(countByStatus(buildTree())).toEqual({
            [QuestionStatus.MAPPED]: 3,
            [QuestionStatus.UNMAPPED]: 3,
            [QuestionStatus.NEVER]: 1,
        });
    });
});

describe('getMappingProgress', () => {
    it('counts the never mapped questions in the total, not as mapped', () => {
        expect(getMappingProgress(countByStatus(buildTree()))).toEqual({
            mapped: 3,
            total: 7,
            percent: (100 * 3) / 7,
        });
    });

    it('is at 0% without questions', () => {
        expect(getMappingProgress(countByStatus([]))).toEqual({
            mapped: 0,
            total: 0,
            percent: 0,
        });
    });
});

describe('getFirstUnmappedNode', () => {
    it('returns the first question not mapped, in display order', () => {
        expect(getFirstUnmappedNode(buildTree())?.key).toBe('q2');
    });

    it('skips the never mapped questions', () => {
        const tree = buildQuestionTree(descriptor, {
            ...questionMappings,
            q2: { type: 'neverMapped' },
        });
        expect(getFirstUnmappedNode(tree)?.key).toBe('services__power');
    });

    it('skips a repeat group for the questions inside it', () => {
        const tree = buildQuestionTree(
            {
                name: 'survey',
                type: 'survey',
                children: [
                    {
                        name: 'children',
                        type: 'repeat',
                        children: [{ name: 'age', type: 'integer' }],
                    },
                ],
            },
            {},
        );
        expect(getFirstUnmappedNode(tree)?.key).toBe('age');
    });

    it('returns nothing once every question is mapped or never mapped', () => {
        const tree = buildQuestionTree(descriptor, {
            ...questionMappings,
            q2: de('schools'),
            q4: { type: 'neverMapped' },
            services__power: de('power'),
        });
        expect(getFirstUnmappedNode(tree)).toBeUndefined();
    });
});

describe('filterQuestionTree', () => {
    it('returns the tree unchanged without search nor status filter', () => {
        const tree = buildTree();
        expect(filterQuestionTree(tree, '  ', ALL_STATUSES)).toBe(tree);
    });

    it('searches the label ignoring case and accents, keeping the parent groups', () => {
        expect(
            shape(filterQuestionTree(buildTree(), 'hopitaux', ALL_STATUSES)),
        ).toEqual([{ belgium: [{ brussels: ['q3 never'] }] }]);
        expect(
            keys(filterQuestionTree(buildTree(), 'ÉCOLE', ALL_STATUSES)),
        ).toEqual(['q2']);
    });

    it('searches the question name and the mapped DHIS2 target', () => {
        expect(
            keys(filterQuestionTree(buildTree(), 'q4', ALL_STATUSES)),
        ).toEqual(['q4']);
        expect(
            keys(filterQuestionTree(buildTree(), 'de water', ALL_STATUSES)),
        ).toEqual(['services__water']);
    });

    it('shows all the questions of a group matching the search', () => {
        expect(
            keys(filterQuestionTree(buildTree(), 'belgique', ALL_STATUSES)),
        ).toEqual(['q1', 'q2', 'q3', 'q5']);
    });

    it('keeps only the questions with the selected statuses', () => {
        expect(
            shape(
                filterQuestionTree(buildTree(), '', [
                    QuestionStatus.MAPPED,
                    QuestionStatus.NEVER,
                ]),
            ),
        ).toEqual([
            {
                belgium: ['q1 mapped', { brussels: ['q3 never', 'q5 mapped'] }],
            },
            { services: ['services__water mapped'] },
        ]);
    });

    it('combines the search and the statuses', () => {
        expect(
            keys(
                filterQuestionTree(buildTree(), 'belgique', [
                    QuestionStatus.UNMAPPED,
                ]),
            ),
        ).toEqual(['q2']);
    });

    it('returns no node when nothing matches', () => {
        expect(
            filterQuestionTree(buildTree(), 'germany', ALL_STATUSES),
        ).toEqual([]);
        expect(filterQuestionTree(buildTree(), '', [])).toEqual([]);
    });
});

describe('getGroupKeys', () => {
    it('lists the groups at every level', () => {
        expect(getGroupKeys(buildTree())).toEqual([
            'belgium',
            'brussels',
            'services',
        ]);
    });
});
