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
            questions = Object.values(indexedQuestions).filter(q => childrenNames.includes(q.parentName));
        } else {
            questions = Object.values(indexedQuestions).filter(
                q => q.parentName === node.name,
            );
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
            node.title || this.getLabel(node, language) || node.hint || node.name
        );
    }

    static recursiveIndex(node, acc) {
        acc[node.name] = node;
        if (this.hasChildren(node)) {
            node.children.forEach((child) => {
                const val = child;
                val.parentName = node.name;
                this.recursiveIndex(child, acc);
            });
        }
    }

    static indexQuestions(descriptor) {
        const acc = {};
        if (descriptor && descriptor.children) {
            descriptor.children.forEach(child => this.recursiveIndex(child, acc));
        }
        return acc;
    }
}

export default Descriptor;
