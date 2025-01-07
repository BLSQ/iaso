import React, { useCallback, useState, FunctionComponent } from 'react';
import { Pagination } from '@mui/lab';
import { Box, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    AddComment,
    CommentWithThread,
    useSafeIntl,
} from 'bluesquare-components';

import { useSnackMutation } from '../../../../../libs/apiHooks';
import { sendComment, useGetComments } from './requests';
import { adaptComment, calculateOffset, adaptComments } from './utils';

import MESSAGES from '../../../messages';
import { OrgUnit } from '../../../types/orgUnit';

const styles = {
    commentsBlock: { marginBottom: '7px' },
    header: { marginTop: '10px' },
};
const useStyles = makeStyles(styles);

type Props = {
    orgUnit?: OrgUnit;
    className?: string;
    maxPages?: number;
    inlineTextAreaButton?: boolean;
};

export const OrgUnitsMapComments: FunctionComponent<Props> = ({
    orgUnit,
    className,
    maxPages = 5,
    inlineTextAreaButton = true,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const [offset, setOffset] = useState<number | null>(null);
    const [pageSize] = useState(maxPages);
    const commentsParams = {
        orgUnitId: orgUnit?.id,
        offset,
        limit: pageSize,
    };
    const { data: comments } = useGetComments(commentsParams);
    const { mutateAsync: postComment } = useSnackMutation<any, any, any, any>(
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
