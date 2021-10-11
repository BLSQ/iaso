class Descriptor {
    static hasChildren(node) {
        return (
            Array.isArray(node.children) &&
            node.type !== 'select one' &&
            node.type !== 'select multiple'
        );
    }

    static getLabel(node, language = 'French') {
        if (node === undefined || node.label === undefined) {
            return undefined;
        }
        return node.label instanceof String || typeof node.label === 'string'
            ? node.label
            : node.label[language];
    }

    static isGroup(node) {
        return (
            node.type === 'survey' ||
            node.type === 'group' ||
            node.type === 'repeat'
        );
    }

    static getCoverage(
        indexedQuestions,
        mappingVersion,
        node,
        isTopNode = false,
    ) {
        let questions = [];
        if (this.isGroup(node)) {
            const childrenNames = node.children.map(c => c.name);
            if (isTopNode) {
                questions = Object.values(indexedQuestions).filter(
                    q =>
                        (q?.path?.some(p => childrenNames.includes(p)) &&
                            !this.isGroup(q)) ||
                        (!this.isGroup(q) && !q.path),
                );
            } else {
                questions = Object.values(indexedQuestions).filter(q => {
                    return (
                        q?.path?.some(p => {
                            return childrenNames.includes(p);
                        }) && !this.isGroup(q)
                    );
                });
                questions = questions.filter(question =>
                    question.path.includes(node.name),
                );
            }
        }
        const mappedQuestions = questions.filter(
            q => mappingVersion.question_mappings[q.name],
        );
        return [mappedQuestions.length, questions.length];
    }

    static getHumanLabel(node, language = 'French') {
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

    static withinRepeatGroup(node, indexedQuestions) {
        if (node.path === undefined) {
            return null;
        }
        return node.path.find(
            questionName =>
                indexedQuestions[questionName] &&
                indexedQuestions[questionName].type === 'repeat',
        );
    }

    static recursiveIndex(node, acc, path) {
        if (!acc[this.getNodeName(node)]) {
            acc[this.getNodeName(node)] = node;
        } else {
            acc[`${this.getNodeName(node)}1`] = node;
        }
        if (this.hasChildren(node)) {
            node.children.forEach(child => {
                const val = child;
                val.parentName = this.getNodeName(node);
                const newPath = [...path, child];
                val.path = newPath.map(n => n.name);
                this.recursiveIndex(child, acc, newPath);
            });
        }
    }

    static getNodeName(node) {
        let result = node.name;
        if (node.type === 'group' && node.name === 'begin') {
            result = node.label;
        }
        return result;
    }

    static indexQuestions(descriptor) {
        const acc = {};
        const descriptorCopy = { ...(descriptor ?? {}) };
        if (descriptor?.children) {
            descriptorCopy.path = ['survey'];
            descriptorCopy.children.forEach(child =>
                this.recursiveIndex(child, acc, [descriptorCopy, child]),
            );
        }
        return acc;
    }
}

export default Descriptor;
