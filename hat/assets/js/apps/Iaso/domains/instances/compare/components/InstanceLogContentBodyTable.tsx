import React, { memo, useCallback } from 'react';
import { TableBody, TableRow, TableCell } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { InstanceImagePreview } from '../../components/InstanceImagePreview';
import { FileContent } from '../../types/instance';
import { formatLabel } from '../../utils';
import { ErrorBoundary } from 'bluesquare-components';

type TableBodyProps = {
    fileContent: FileContent;
    fileDescriptor?: Record<string, any>;
};
const useStyles = makeStyles(theme => ({
    tableCell: {
        backgroundColor: 'transparent',
        borderTop: 'none !important',
        borderLeft: 'none !important',
        // @ts-ignore
        borderRight: `1px solid ${theme.palette.ligthGray.border}  !important`,
        // @ts-ignore
        borderBottom: `1px solid ${theme.palette.ligthGray.border}  !important`,
    },
    deletedInfos: {
        color: '#D22B2B !important',
    },
    tableCellLabelName: {
        // @ts-ignore
        color: theme.palette.mediumGray.main,
    },
    highlightedRow: {
        backgroundColor: '#f7eb9c',
    },
}));

function safeZip(a, b) {
    const arrA = Array.isArray(a) ? a : [];
    const arrB = Array.isArray(b) ? b : [];
    const len = Math.max(arrA.length, arrB.length);
    return Array.from({ length: len }, (_, i) => [arrA[i], arrB[i]]);
}

function findNode(node:any, target_name: string) {
    if (node.name === target_name) return node;
    if (!node.children) return null;
    for (const child of node.children) {
        const found = findNode(child, target_name);
        if (found) return found;
    }
    return null;
}

function renderRepeatGroup(
    fileContent: FileContent,
    question: Record<string, any>,
    classes,
    renderLogContent: (
        isImg: any,
        question: any,
        anwser: any,
        logFiles: any,
    ) => any,
) {
    const valueA = fileContent.logA.json[question.name];
    const valueB = fileContent.logB.json[question.name];

    const records: JSX.Element[] = [];
    for (let [recordA, recordB] of safeZip(valueA, valueB)) {
        // TODO fetch the 2 formDescriptor for more accurate rendering/type
        let questionNames = Array.from(
            new Set(
                (recordA ? Object.keys(recordA) : []).concat(
                    recordB ? Object.keys(recordB) : [],
                ),
            ),
        );

        for (let questionName of questionNames) {
            let question = fileContent.fields.find(f => f.name == questionName);
            if (question == undefined) {
                const qA = findNode(fileContent?.formDescriptorA, questionName);
                const qB = findNode(fileContent?.formDescriptorB, questionName);
                question = qA || qB;
            }
            records.push(
                <QuestionRow
                    key={questionName}
                    valueA={recordA?.[questionName]}
                    valueB={recordB?.[questionName]}
                    question={question}
                    classes={classes}
                    renderLogContent={renderLogContent}
                    fileContent={fileContent}
                />,
            );
        }
    }
    return records;
}

function QuestionRow({
    valueA,
    valueB,
    question,
    classes,
    renderLogContent,
    fileContent,
}) {
    const hasLogContent = valueA || valueB;

    const field = question;

    const isValuesDifferent = valueA !== valueB;
    const isImg = ['image', 'photo'].includes(question.type);

    if (!hasLogContent) {
        return null;
    }
    return (
        <TableRow
            key={question.name}
            className={isValuesDifferent ? classes.highlightedRow : undefined}
        >
            <TableCell className={classes.tableCell} align="left">
                <div>{field ? formatLabel(field) : question.name}</div>
                <span className={classes.tableCellLabelName}>
                    {question.name}
                </span>
            </TableCell>

            <TableCell className={classes.tableCell} align="left">
                {renderLogContent(
                    isImg,
                    question,
                    valueA,
                    fileContent.logAFiles,
                )}
            </TableCell>
            <TableCell className={classes.tableCell} align="left">
                {renderLogContent(
                    isImg,
                    question,
                    valueB,
                    fileContent.logBFiles,
                )}
            </TableCell>
        </TableRow>
    );
}

const InstanceLogContentBodyTable = memo(({ fileContent }: TableBodyProps) => {
    const classes = useStyles();
    const getImageUrl = useCallback((value, logFiles) => {
        if (value && logFiles) {
            return logFiles[value]
        }
        return null;
    }, []);

    const renderLogContent = useCallback(
        (isImg, question: any, answer, logFiles) => {
            if (isImg) {
                return (
                    <InstanceImagePreview
                        imageUrl={getImageUrl(answer, logFiles)}
                        altText={question.name}
                    />
                );
            }

            if (question.type == 'file') {
                return <a href={getImageUrl(answer, logFiles)}>{answer}</a>;
            }
            return answer;
        },
        [getImageUrl],
    );
    return (
        <ErrorBoundary>
            <TableBody>
                {fileContent.logA &&
                    fileContent.logB &&
                    fileContent?.fields.map(question => {
                        const isRelevantQuestion = ![
                            'meta',
                            'instanceID',
                        ].includes(question.name);

                        if (question.type == 'repeat') {
                            return renderRepeatGroup(
                                fileContent,
                                question,
                                classes,
                                renderLogContent,
                            );
                        }

                        return isRelevantQuestion ? (
                            <QuestionRow
                                valueA={fileContent.logA.json[question.name]}
                                valueB={fileContent.logB.json[question.name]}
                                question={question}
                                classes={classes}
                                renderLogContent={renderLogContent}
                                fileContent={fileContent}
                            />
                        ) : null;
                    })}
            </TableBody>
        </ErrorBoundary>
    );
});

export default InstanceLogContentBodyTable;
