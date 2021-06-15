import React, { useCallback, useState, useEffect } from 'react';
import { Comment, CommentsList, AddComment } from 'bluesquare-components';
import { Box, Typography } from '@material-ui/core';
import { useSelector } from 'react-redux';
import {
    useAPI,
    mockGetComments,
    mockPostComment,
} from '../../../utils/requests';
// import { AddOrgUnitComment } from './AddOrgUnitComment';

const adaptComment = comment => {
    return {
        author: `${comment.author.first_name} ${comment.author.last_name}`,
        comment: comment.comment,
        dateTime: comment.dateTime,
        id: comment.id,
        authorId: comment.author.id,
        parentId: comment.parent_comment_id,
    };
};

const adaptComments = comments => {
    return comments.map(comment => {
        return adaptComment(comment);
    });
};

const OrgUnitsMapComments = () => {
    const orgUnit = useSelector(state => state.orgUnits.currentSubOrgUnit);
    // console.log('orgUnit', orgUnit);
    // TODO add Loading state for both API calls
    const { data: comments = null } = useAPI(mockGetComments, orgUnit);
    const [commentToPost, setCommentToPost] = useState();
    const [temp, setTemp] = useState(null);

    const addReply = useCallback(
        (text, id) => {
            const requestBody = {
                parent_comment_id: id,
                comment: text,
                model: 'org_units',
                object_id: orgUnit.id,
            };
            setCommentToPost(requestBody);
        },
        [mockPostComment, orgUnit],
    );
    const formatComment = comment => {
        const mainComment = adaptComment(comment);
        if (!comment.children) {
            return (
                <Comment
                    author={mainComment.author}
                    content={mainComment.comment}
                    postingTime={mainComment.dateTime}
                    id={mainComment.id}
                    key={
                        mainComment.author +
                        mainComment.id +
                        mainComment.dateTime
                    }
                    actionText="Reply"
                    onAddComment={addReply}
                />
            );
        }
        const childrenComments = adaptComments(comment.children);
        return (
            <CommentsList
                comments={[mainComment, ...childrenComments]}
                key={mainComment.author + mainComment.id + mainComment.dateTime}
                actionText="Add reply"
                onAddComment={addReply}
            />
        );
    };
    const formatComments = commentsArray => {
        if (commentsArray?.length > 0) {
            const formattedComments = commentsArray.map(comment =>
                formatComment(comment),
            );
            return formattedComments;
        }
        return null;
    };
    const onConfirm = useCallback(
        async text => {
            const comment = {
                comment: text,
                object_id: orgUnit.id,
                parent_comment_id: null,
                model: 'org_units',
            };
            setCommentToPost(comment);
        },
        [mockPostComment, orgUnit],
    );

    useEffect(() => {
        // eslint-disable-next-line consistent-return
        const updateComment = async () => {
            if (!commentToPost) return null;
            let updatedComment = null;
            if (commentToPost.parent_comment_id) {
                updatedComment = await mockPostComment(commentToPost, true);
            } else {
                updatedComment = await mockPostComment(commentToPost);
            }
            setTemp(updatedComment.data);
        };
        updateComment();
    }, [commentToPost]);
    return (
        <>
            <Box px={2} mb={3} component="div">
                <Typography variant="h6">
                    {orgUnit?.name ?? 'Please select an Org Unit'}
                </Typography>
                {orgUnit && <AddComment onConfirm={onConfirm} />}
                {formatComments(temp ?? comments?.data)}
            </Box>
        </>
    );
};

export { OrgUnitsMapComments };
