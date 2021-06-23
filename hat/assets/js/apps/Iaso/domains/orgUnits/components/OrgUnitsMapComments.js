import React, { useCallback, useState, useEffect } from 'react';
import { CommentWithThread, AddComment } from 'bluesquare-components';
import { Pagination } from '@material-ui/lab';
import { Box, Typography, makeStyles } from '@material-ui/core';

import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useGetComments, postComment } from '../../../utils/requests';

const styles = {
    commentsBlock: { marginBottom: '7px' },
    header: { marginTop: '10px' },
};
const useStyles = makeStyles(styles);

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
    if (!comments) return [];
    return comments.map(comment => {
        return adaptComment(comment);
    });
};

const calculateOffset = (page, pageSize) => {
    const multiplier = page - 1 > 0 ? page - 1 : 0;
    return pageSize * multiplier;
};

const OrgUnitsMapComments = ({
    orgUnit,
    className,
    maxPages,
    inlineTextAreaButton,
    getOrgUnitFromStore,
}) => {
    const classes = useStyles();
    const globalStateOrgUnit = useSelector(
        state => state.orgUnits.currentSubOrgUnit,
    );
    const orgUnitToUse = getOrgUnitFromStore ? globalStateOrgUnit : orgUnit;
    // TODO add Loading state for both API calls
    // Saving the lastPostedComment in order to trigger refetch after a POST
    const [lastPostedComment, setLastPostedComment] = useState(0);
    const [offset, setOffset] = useState(null);
    // eslint-disable-next-line no-unused-vars
    const [pageSize, setPageSize] = useState(maxPages);
    const { data: comments } = useGetComments({
        orgUnitId: orgUnitToUse?.id,
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
                object_pk: orgUnitToUse?.id,
            };
            setCommentToPost(requestBody);
        },
        [orgUnitToUse],
    );
    const formatComment = comment => {
        const mainComment = adaptComment(comment);
        const childrenComments = adaptComments(comment.children);
        return (
            <CommentWithThread
                comments={[mainComment, ...childrenComments]}
                key={mainComment.author + mainComment.id + mainComment.dateTime}
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
                object_pk: orgUnitToUse?.id,
                parent: null,
                // content_type: 57,
                content_type: 'iaso-orgunit',
            };
            setCommentToPost(comment);
        },
        [orgUnitToUse],
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
            <Box px={2} component="div" className={classes.header}>
                <Typography variant="h5">
                    {orgUnitToUse?.name ?? 'Please select an Org Unit'}
                </Typography>
                {orgUnitToUse && (
                    <AddComment
                        onConfirm={onConfirm}
                        inline={inlineTextAreaButton}
                    />
                )}
            </Box>
            <div className={`${className} ${classes.commentsBlock}`}>
                {formatComments(comments?.results)}
            </div>
            {comments?.count > 1 && (
                <Pagination
                    count={Math.ceil(comments?.count / pageSize)}
                    onChange={(_, page) => {
                        setOffset(calculateOffset(page, pageSize));
                    }}
                    shape="rounded"
                />
            )}
        </>
    );
};

OrgUnitsMapComments.propTypes = {
    orgUnit: PropTypes.object,
    className: PropTypes.string,
    maxPages: PropTypes.number,
    inlineTextAreaButton: PropTypes.bool,
    getOrgUnitFromStore: PropTypes.bool,
};
OrgUnitsMapComments.defaultProps = {
    orgUnit: null,
    className: '',
    maxPages: 5,
    inlineTextAreaButton: true,
    getOrgUnitFromStore: false,
};

export { OrgUnitsMapComments };
