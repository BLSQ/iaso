class Descriptor {
  hasChildren(node) {
    return (
      Array.isArray(node.children) &&
      node.type !== "select one" &&
      node.type !== "select multiple"
    );
  }

  getHumanLabel(node) {
    return node.title || node.label || node.hint || node.name;
  }

  recursiveIndex(node, acc) {
    acc[node.name] = node;
    if (this.hasChildren(node)) {
      node.children.forEach(child => {
        child.parent_name = node.name;
        this.recursiveIndex(child, acc);
      });
    }
  }
  indexQuestions(descriptor) {
    const acc = {};
    descriptor.children.forEach(child => this.recursiveIndex(child, acc));
    return acc;
  }

  getCoverage(indexedQuestions, mappingVersion, node) {
    let questions = [];
    if (node.type == "survey") {
      const childrenNames = node.children.map(c => c.name);
      questions = Object.values(indexedQuestions).filter(q =>
        childrenNames.includes(q.parent_name)
      );
    } else {
      questions = Object.values(indexedQuestions).filter(
        q => q.parent_name == node.name
      );
    }

    const mappedQuestions = questions.filter(
      q => mappingVersion.question_mappings[q.name]
    );
    return [mappedQuestions.length, questions.length];
  }
}

export default new Descriptor();
