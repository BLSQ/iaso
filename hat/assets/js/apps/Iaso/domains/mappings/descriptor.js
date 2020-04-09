class Descriptor {
    static hasChildren(node) {
        return (
            Array.isArray(node.children)
      && node.type !== 'select one'
      && node.type !== 'select multiple'
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

    static getCoverage(indexedQuestions, mappingVersion, node) {
        let questions = [];
        if (node.type === 'survey') {
            const childrenNames = node.children.map(c => c.name);
            questions = Object.values(indexedQuestions).filter(q => childrenNames.includes(q.parent_name));
        } else {
            questions = Object.values(indexedQuestions).filter(
                q => q.parent_name === node.name,
            );
        }

        const mappedQuestions = questions.filter(
            q => mappingVersion.question_mappings[q.name],
        );
        return [mappedQuestions.length, questions.length];
    }

    getHumanLabel(node, language = 'French') {
        if (node === undefined) {
            return undefined;
        }
        return (
            node.title || this.getLabel(node, language) || node.hint || node.name
        );
    }

    recursiveIndex(node, acc) {
        acc[node.name] = node;
        if (this.hasChildren(node)) {
            node.children.forEach((child) => {
                const newChild = {
                    ...child,
                    parent_name: node.name,
                };
                this.recursiveIndex(newChild, acc);
            });
        }
    }

    indexQuestions(descriptor) {
        const acc = {};
        if (descriptor && descriptor.chldren) {
            descriptor.children.forEach(child => this.recursiveIndex(child, acc));
        }
        return acc;
    }
}

export default new Descriptor();
