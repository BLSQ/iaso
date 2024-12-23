import { Pagination } from '@mui/lab';
import { Box, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    AddComment,
    CommentWithThread,
    useSafeIntl,
} from 'bluesquare-components';
import React, { useCallback, useState } from 'react';

import { useSnackMutation } from 'Iaso/libs/apiHooks.ts';
import PropTypes from 'prop-types';
import { sendComment, useGetComments } from '../../../../utils/requests';

import MESSAGES from '../../messages.ts';

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
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const [offset, setOffset] = useState(null);
    const [pageSize] = useState(maxPages);
    const commentsParams = {
        orgUnitId: orgUnit?.id,
        offset,
        limit: pageSize,
    };
    const { data: comments } = useGetComments(commentsParams);
    const { mutateAsync: postComment } = useSnackMutation(
        sendComment,
        undefined,
        undefined,
        ['comments', commentsParams],
    );

    const addReply = useCallback(
        async (text, id) => {
            const requestBody = {
                parent: id,
                comment: text,
                content_type: 'iaso-orgunit',
                object_pk: orgUnit?.id,
            };
            await postComment(requestBody);
        },
        [orgUnit, postComment],
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
                object_pk: orgUnit?.id,
                parent: null,
                // content_type: 57,
                content_type: 'iaso-orgunit',
            };
            await postComment(comment);
        },
        [orgUnit, postComment],
    );

    return (
        <>
            <Box px={2} component="div" className={classes.header}>
                <Typography variant="body1">
                    {orgUnit?.name ?? formatMessage(MESSAGES.selectOrgUnit)}
                </Typography>
                {orgUnit && (
                    <AddComment
                        onConfirm={onConfirm}
                        inline={inlineTextAreaButton}
                    />
                )}
            </Box>
            <div
                className={`comments-list ${className} ${classes.commentsBlock}`}
            >
                {formatComments(comments?.results)}
            </div>
            {comments?.count > 1 && (
                <Pagination
                    count={Math.ceil((comments?.count ?? 0) / pageSize)}
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
};
OrgUnitsMapComments.defaultProps = {
    orgUnit: null,
    className: '',
    maxPages: 5,
    inlineTextAreaButton: true,
};

export { OrgUnitsMapComments };
