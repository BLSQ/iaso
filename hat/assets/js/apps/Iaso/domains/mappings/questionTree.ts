import { uniqBy } from 'lodash';
import Descriptor from './descriptor';
import { getMappingLabel, hasTarget } from './importMappings';
import { isNeverMapped } from './question_mappings';
import { QuestionMappings, QuestionStatus, QuestionTreeNode } from './types';

// groups only organise the tree, a select all that apply is mapped choice by choice
const NOT_SELECTABLE_TYPES = ['survey', 'group', 'select all that apply'];

export const ALL_STATUSES: QuestionStatus[] = [
    QuestionStatus.MAPPED,
    QuestionStatus.UNMAPPED,
    QuestionStatus.NEVER,
];

export const getQuestionStatus = (
    mapping: QuestionMappings[string] | undefined,
): QuestionStatus => {
    if (isNeverMapped(mapping)) {
        return QuestionStatus.NEVER;
    }
    return hasTarget(mapping) ? QuestionStatus.MAPPED : QuestionStatus.UNMAPPED;
};

const buildNode = (
    question: Record<string, any>,
    questionMappings: QuestionMappings,
): QuestionTreeNode => {
    const key = Descriptor.getKey(question);
    const mapping = questionMappings[key];
    const node: QuestionTreeNode = {
        key,
        name: question.name,
        label: Descriptor.getHumanLabel(question),
        type: question.type,
        question,
        selectable: !NOT_SELECTABLE_TYPES.includes(question.type),
        status: getQuestionStatus(mapping),
        target: hasTarget(mapping) ? getMappingLabel(mapping) : undefined,
        mappedCount: 0,
        questionsCount: 0,
    };
    if (Descriptor.hasChildren(question)) {
        const children: QuestionTreeNode[] = question.children.map(
            (child: Record<string, any>) => buildNode(child, questionMappings),
        );
        node.children = children;
        children.forEach(child => {
            if (child.children) {
                node.mappedCount += child.mappedCount;
                node.questionsCount += child.questionsCount;
            } else {
                node.questionsCount += 1;
                if (child.status === QuestionStatus.MAPPED) {
                    node.mappedCount += 1;
                }
            }
        });
    }
    return node;
};

/**
 * Questions of a form version as a tree, each one with its mapping status.
 * Group nodes count the questions (leaves) below them.
 */
export const buildQuestionTree = (
    descriptor: Record<string, any> | undefined,
    questionMappings: QuestionMappings,
): QuestionTreeNode[] => {
    if (!descriptor?.children) {
        return [];
    }
    // sets the keys (uuid) of the select all that apply choices
    Descriptor.indexQuestions(descriptor);
    return descriptor.children.map((child: Record<string, any>) =>
        buildNode(child, questionMappings),
    );
};

const forEachQuestion = (
    nodes: QuestionTreeNode[],
    callback: (node: QuestionTreeNode) => void,
) => {
    nodes.forEach(node => {
        if (node.children) {
            forEachQuestion(node.children, callback);
        } else {
            callback(node);
        }
    });
};

export const countByStatus = (
    nodes: QuestionTreeNode[],
): Record<QuestionStatus, number> => {
    const counts = {
        [QuestionStatus.MAPPED]: 0,
        [QuestionStatus.UNMAPPED]: 0,
        [QuestionStatus.NEVER]: 0,
    };
    forEachQuestion(nodes, node => {
        counts[node.status] += 1;
    });
    return counts;
};

const normalize = (text: string | undefined): string =>
    (text ?? '')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();

const matchesSearch = (node: QuestionTreeNode, search: string) =>
    [node.label, node.name, node.target].some(text =>
        normalize(text).includes(search),
    );

const filterNodes = (
    nodes: QuestionTreeNode[],
    search: string,
    statuses: QuestionStatus[],
): QuestionTreeNode[] =>
    nodes.flatMap(node => {
        const matches = !search || matchesSearch(node, search);
        if (node.children) {
            // a matching group shows all its questions
            const children = filterNodes(
                node.children,
                matches ? '' : search,
                statuses,
            );
            const selfVisible =
                node.selectable && matches && statuses.includes(node.status);
            return children.length > 0 || selfVisible
                ? [{ ...node, children }]
                : [];
        }
        return matches && statuses.includes(node.status) ? [node] : [];
    });

/**
 * Questions matching the search (label, name or mapped DHIS2 target,
 * ignoring case and accents) and one of the statuses, with their groups.
 */
export const filterQuestionTree = (
    nodes: QuestionTreeNode[],
    search: string,
    statuses: QuestionStatus[],
): QuestionTreeNode[] => {
    const normalizedSearch = normalize(search.trim());
    if (!normalizedSearch && statuses.length === ALL_STATUSES.length) {
        return nodes;
    }
    return filterNodes(nodes, normalizedSearch, statuses);
};

const flattenSelectable = (nodes: QuestionTreeNode[]): QuestionTreeNode[] =>
    nodes.flatMap(node => [
        ...(node.selectable ? [node] : []),
        ...flattenSelectable(node.children ?? []),
    ]);

/**
 * Selectable nodes in display order, for previous / next navigation.
 * A form can reuse a question name in two groups: both share one mapping
 * (question_mappings is keyed by name), so only the first one is kept,
 * otherwise "next" would loop back to it.
 */
export const getSelectableNodes = (
    nodes: QuestionTreeNode[],
): QuestionTreeNode[] => uniqBy(flattenSelectable(nodes), node => node.key);

export const getGroupKeys = (nodes: QuestionTreeNode[]): string[] =>
    nodes.flatMap(node =>
        node.children ? [node.key, ...getGroupKeys(node.children)] : [],
    );
