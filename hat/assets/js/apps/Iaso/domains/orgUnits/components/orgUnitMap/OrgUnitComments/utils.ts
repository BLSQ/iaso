export const adaptComment = comment => {
    const author =
        comment.user.first_name && comment.user.last_name
            ? `${comment.user.first_name} ${comment.user.last_name}`
            : (comment.user.username ?? 'Unknown');
    const result = {
        author,
        comment: comment.comment,
        dateTime: comment.submit_date,
        id: comment.id,
        authorId: comment.user.id,
        parentId: comment.parent_comment_id,
    };
    return result;
};

export const adaptComments = comments => {
    if (!comments) return [];
    return comments.map(comment => {
        return adaptComment(comment);
    });
};

export const calculateOffset = (page, pageSize) => {
    const multiplier = page - 1 > 0 ? page - 1 : 0;
    return pageSize * multiplier;
};
