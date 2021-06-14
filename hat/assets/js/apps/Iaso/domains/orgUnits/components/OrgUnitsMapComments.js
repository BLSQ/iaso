import React from 'react';
import { Comment, CommentsList } from 'bluesquare-components';
import { Box } from '@material-ui/core';
import { useSelector } from 'react-redux';
import { useAPI, mockGetComments } from '../../../utils/requests';

const adaptComment = comment => {
    return {
        author: `${comment.author.first_name} ${comment.author.last_name}`,
        comment: comment.comment,
        dateTime: comment.dateTime,
        id: comment.id,
    };
};

const adaptComments = comments => {
    return comments.map(comment => {
        return adaptComment(comment);
    });
};

const formatComment = comment => {
    const mainComment = adaptComment(comment);
    if (!comment.children) {
        return (
            <Comment
                author={mainComment.author}
                content={mainComment.comment}
                postingTime={mainComment.dateTime}
                id={mainComment.id}
                key={mainComment.author + mainComment.id + mainComment.dateTime}
            />
        );
    }
    const childrenComments = adaptComments(comment.children);
    return (
        <CommentsList
            comments={[mainComment, ...childrenComments]}
            key={mainComment.author + mainComment.id + mainComment.dateTime}
        />
    );
};
const formatComments = comments => {
    if (comments?.length > 0) {
        const formattedComments = comments.map(comment =>
            formatComment(comment),
        );
        return formattedComments;
    }
    return null;
};

const OrgUnitsMapComments = () => {
    const orgUnit = useSelector(state => state.orgUnits.currentSubOrgUnit);
    const { data: comments = null } = useAPI(mockGetComments, orgUnit);
    return (
        <Box px={2} my={5} component="div">
            {formatComments(comments?.data)}
        </Box>
    );
};

export { OrgUnitsMapComments };
