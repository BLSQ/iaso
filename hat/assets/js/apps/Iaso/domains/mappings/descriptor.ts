import { MappingVersionRow } from './types';

/** A node from a form version descriptor (XLSForm / ODK survey tree). */
export type DescriptorNode = {
    name?: string;
    type?: string;
    label?: string | Record<string, string>;
    title?: string;
    hint?: string;
    uuid?: string;
    path?: string[];
    parentName?: string;
    children?: DescriptorNode[];
    [key: string]: any;
};

export type IndexedQuestions = Record<string, DescriptorNode>;

class Descriptor {
    static hasChildren(node: DescriptorNode): boolean {
        return Array.isArray(node.children) && node.type !== 'select one';
    }

    static getLabel(
        node: DescriptorNode | undefined,
        language = 'French',
    ): string | undefined {
        if (node === undefined || node.label === undefined) {
            return undefined;
        }
        return node.label instanceof String || typeof node.label === 'string'
            ? (node.label as string)
            : (node.label as Record<string, string>)[language];
    }

    static isGroup(node: DescriptorNode): boolean {
        return (
            node.type === 'survey' ||
            node.type === 'group' ||
            node.type === 'repeat' ||
            node.type === 'select all that apply'
        );
    }

    static getCoverage(
        indexedQuestions: IndexedQuestions,
        mappingVersion: MappingVersionRow,
        node: DescriptorNode,
        isTopNode = false,
    ): [number, number] {
        let questions: DescriptorNode[] = [];
        if (this.isGroup(node)) {
            const childrenNames = (node.children ?? []).map(c => c.name);

            const comparePathWithChildrenNames = (question: DescriptorNode) =>
                question.path?.some(p => childrenNames.includes(p)) &&
                !this.isGroup(question);

            if (isTopNode) {
                questions = Object.values(indexedQuestions).filter(
                    q =>
                        comparePathWithChildrenNames(q) ||
                        (!this.isGroup(q) && !q.path),
                );
            } else {
                questions = Object.values(indexedQuestions).filter(q => {
                    return comparePathWithChildrenNames(q);
                });
                questions = questions.filter(question =>
                    question.path?.includes(node.name as string),
                );
            }
        }
        const mappedQuestions = questions.filter(
            q => mappingVersion.question_mappings[this.getKey(q)],
        );
        return [mappedQuestions.length, questions.length];
    }

    static getHumanLabel(
        node: DescriptorNode | undefined,
        language = 'French',
    ): string | undefined {
        if (node === undefined) {
            return undefined;
        }
        return (
            node.title ||
            this.getLabel(node, language) ||
            node.hint ||
            node.name
        );
    }

    static withinRepeatGroup(
        node: DescriptorNode,
        indexedQuestions: IndexedQuestions,
    ): string | null | undefined {
        if (node.path === undefined) {
            return null;
        }
        return node.path.find(
            questionName =>
                indexedQuestions[questionName] &&
                indexedQuestions[questionName].type === 'repeat',
        );
    }

    static recursiveIndex(
        node: DescriptorNode,
        acc: IndexedQuestions,
        path: DescriptorNode[],
        parent?: DescriptorNode,
    ): void {
        if (!acc[this.getNodeName(node, parent)]) {
            acc[this.getNodeName(node, parent)] = node;
        } else {
            acc[`${this.getNodeName(node)}1`] = node;
        }
        if (this.hasChildren(node)) {
            node.children!.forEach(child => {
                const val = child;
                val.parentName = this.getNodeName(node, parent);
                const newPath = [...path, child];
                val.path = newPath.map(n => n.name as string);
                this.recursiveIndex(child, acc, newPath, node);
            });
        }
    }

    static getKey(node: DescriptorNode): string {
        return node.uuid || node.name || '';
    }

    static getNodeName(node: DescriptorNode, parent?: DescriptorNode): string {
        let result: any = node.name;
        if (node.type === 'group' && node.name === 'begin') {
            result = node.label;
        }

        if (parent && parent.type == 'select all that apply') {
            result = `${parent.name}__${node.name}`;
            node.uuid = result;
        }

        return result;
    }

    /** the questions by name */
    static indexQuestions(
        descriptor?: DescriptorNode | null,
    ): IndexedQuestions {
        const acc: IndexedQuestions = {};
        const descriptorCopy: DescriptorNode = { ...(descriptor ?? {}) };
        if (descriptor?.children) {
            descriptorCopy.path = ['survey'];
            descriptorCopy.children!.forEach(child =>
                this.recursiveIndex(
                    child,
                    acc,
                    [descriptorCopy, child],
                    descriptorCopy,
                ),
            );
        }
        return acc;
    }
}

export default Descriptor;
