import React, { useCallback, useState, useEffect } from 'react';
import { Comment, CommentsList, AddComment } from 'bluesquare-components';
import { Box, Typography } from '@material-ui/core';
import { useSelector } from 'react-redux';
import moment from 'moment';
import {
    useAPI,
    getComments,
    mockPostComment,
    postComment,
} from '../../../utils/requests';
// import { AddOrgUnitComment } from './AddOrgUnitComment';

const adaptComment = comment => {
    const author =
        comment.user.first_name && comment.user.last_name
            ? `${comment.user.first_name} ${comment.user.last_name}`
            : comment.user.username ?? 'Unknown';
    const result = {
        author,
        comment: comment.comment,
        dateTime: comment.dateTime ?? moment.now().toString(),
        id: comment.id,
        authorId: comment.user.id,
        parentId: comment.parent_comment_id,
    };
    return result;
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
    // Saving the lastPostedComment in order to trigger refetch after a POST
    const [lastPostedComment, setLastPostedComment] = useState(0);
    const { data: comments = null } = useAPI(getComments, orgUnit, {
        additionalDependencies: [lastPostedComment],
    });
    console.log('results in component', comments);
    const [commentToPost, setCommentToPost] = useState();

    const addReply = useCallback(
        (text, id) => {
            const requestBody = {
                parent: id,
                comment: text,
                content_type: 57,
                // content_type: 'iaso-orgunits',
                object_pk: orgUnit.id,
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
                parentId={mainComment.id}
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
                object_pk: orgUnit.id,
                parent: null,
                content_type: 57,
                // content_type: 'iaso-orgunits',
            };
            setCommentToPost(comment);
        },
        [mockPostComment, orgUnit],
    );

    useEffect(() => {
        // eslint-disable-next-line consistent-return
        const updateComment = async () => {
            if (!commentToPost) return null;
            const postedComment = await postComment(commentToPost);
            setLastPostedComment(postedComment.id);
        };
        updateComment();
    }, [commentToPost, postComment]);
    return (
        <>
            <Box px={2} mb={3} component="div">
                <Typography variant="h6">
                    {orgUnit?.name ?? 'Please select an Org Unit'}
                </Typography>
                {orgUnit && <AddComment onConfirm={onConfirm} />}
                {formatComments(comments?.results)}
            </Box>
        </>
    );
};

export { OrgUnitsMapComments };
