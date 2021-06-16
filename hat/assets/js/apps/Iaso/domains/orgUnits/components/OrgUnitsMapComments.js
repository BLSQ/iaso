import React, { useCallback, useState, useEffect } from 'react';
import { Comment, CommentsList, AddComment } from 'bluesquare-components';
import { Pagination } from '@material-ui/lab';
import { Box, Typography } from '@material-ui/core';
import { useSelector } from 'react-redux';
import { useGetComments, postComment } from '../../../utils/requests';

const adaptComment = comment => {
    const author =
        comment.user.first_name && comment.user.last_name
            ? `${comment.user.first_name} ${comment.user.last_name}`
            : comment.user.username ?? 'Unknown';
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

const adaptComments = comments => {
    return comments.map(comment => {
        return adaptComment(comment);
    });
};

const calculateOffset = (page, pageSize) => {
    const multiplier = page - 1 > 0 ? page - 1 : 0;
    return pageSize * multiplier;
};

const OrgUnitsMapComments = () => {
    const orgUnit = useSelector(state => state.orgUnits.currentSubOrgUnit);
    // TODO add Loading state for both API calls
    // Saving the lastPostedComment in order to trigger refetch after a POST
    const [lastPostedComment, setLastPostedComment] = useState(0);
    const [offset, setOffset] = useState(null);
    // eslint-disable-next-line no-unused-vars
    const [pageSize, setPageSize] = useState(5);
    const { data: comments } = useGetComments({
        orgUnitId: orgUnit.id,
        offset,
        limit: pageSize,
        refreshTrigger: lastPostedComment,
    });
    const [commentToPost, setCommentToPost] = useState();

    const addReply = useCallback(
        (text, id) => {
            const requestBody = {
                parent: id,
                comment: text,
                content_type: 'iaso-orgunit',
                object_pk: orgUnit.id,
            };
            setCommentToPost(requestBody);
        },
        [orgUnit],
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
                // content_type: 57,
                content_type: 'iaso-orgunit',
            };
            setCommentToPost(comment);
        },
        [orgUnit],
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
            {comments?.count > 1 && (
                <Pagination
                    count={Math.ceil(comments?.count / pageSize)}
                    hidePrevButton={!comments?.previous}
                    hideNextButton={!comments?.next}
                    onChange={(_, page) => {
                        setOffset(calculateOffset(page, pageSize));
                    }}
                    shape="rounded"
                />
            )}
        </>
    );
};

export { OrgUnitsMapComments };
