import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    ChevronLeft,
    ChevronRight,
    ExpandMore,
    KeyboardArrowRight,
} from '@mui/icons-material';
import {
    Box,
    Divider,
    IconButton,
    Paper,
    Tooltip,
    Typography,
} from '@mui/material';
import { TreeItem, TreeView } from '@mui/x-tree-view';
import { MENU_HEIGHT_WITHOUT_TABS, useSafeIntl } from 'bluesquare-components';
import InputComponent from '../../../../components/forms/InputComponent';
import { SxStyles } from '../../../../types/general';
import MESSAGES from '../../messages';
import {
    ALL_STATUSES,
    countByStatus,
    filterQuestionTree,
    getGroupKeys,
    getSelectableNodes,
} from '../../questionTree';
import { QuestionStatus, QuestionTreeNode } from '../../types';
import { QuestionTreeLabel } from './QuestionTreeLabel';
import { StatusFilterChips } from './StatusFilterChips';

// page padding and the progress / actions bar above the tree
const PAGE_HEADER_HEIGHT = 125;

const styles: SxStyles = {
    root: {
        display: 'flex',
        flexDirection: 'column',
        height: `calc(100vh - ${MENU_HEIGHT_WITHOUT_TABS}px - ${PAGE_HEADER_HEIGHT}px)`,
        minHeight: 400,
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 2,
        py: 1,
    },
    title: {
        flex: '1 1 auto',
    },
    position: {
        color: 'text.secondary',
        fontVariantNumeric: 'tabular-nums',
        mr: 0.5,
    },
    filters: {
        px: 2,
        pb: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
    },
    tree: {
        flex: '1 1 auto',
        overflowY: 'auto',
        py: 1,
    },
    treeItem: {
        '& .MuiTreeItem-content': {
            py: 0.25,
        },
        '& .MuiTreeItem-label': {
            minWidth: 0,
        },
    },
    noMatch: {
        p: 3,
        textAlign: 'center',
        color: 'text.secondary',
    },
};

type Props = {
    nodes: QuestionTreeNode[];
    selectedKey?: string;
    onSelect: (question: Record<string, any>) => void;
};

const renderNode = (node: QuestionTreeNode) => (
    <TreeItem
        key={node.key}
        nodeId={node.key}
        label={<QuestionTreeLabel node={node} />}
        sx={styles.treeItem}
    >
        {node.children?.map(renderNode)}
    </TreeItem>
);

export const QuestionTree: FunctionComponent<Props> = ({
    nodes,
    selectedKey,
    onSelect,
}) => {
    const { formatMessage } = useSafeIntl();
    const [search, setSearch] = useState('');
    const [statuses, setStatuses] = useState<QuestionStatus[]>(ALL_STATUSES);
    const [collapsedKeys, setCollapsedKeys] = useState<string[]>([]);
    const treeRef = useRef<HTMLUListElement>(null);

    const counts = useMemo(() => countByStatus(nodes), [nodes]);
    const visibleNodes = useMemo(
        () => filterQuestionTree(nodes, search, statuses),
        [nodes, search, statuses],
    );
    const selectableNodes = useMemo(
        () => getSelectableNodes(visibleNodes),
        [visibleNodes],
    );
    const nodesByKey = useMemo(
        () =>
            Object.fromEntries(
                getSelectableNodes(nodes).map(node => [node.key, node]),
            ),
        [nodes],
    );
    const expandedKeys = useMemo(
        () =>
            getGroupKeys(visibleNodes).filter(
                key => !collapsedKeys.includes(key),
            ),
        [visibleNodes, collapsedKeys],
    );
    const position = selectableNodes.findIndex(
        node => node.key === selectedKey,
    );

    const handleSearchChange = (_key: string, value: string) => {
        setSearch(value);
        setCollapsedKeys([]);
    };
    const handleStatusesChange = (newStatuses: QuestionStatus[]) => {
        setStatuses(newStatuses);
        setCollapsedKeys([]);
    };
    const handleToggle = (_event: React.SyntheticEvent, keys: string[]) => {
        setCollapsedKeys(
            getGroupKeys(visibleNodes).filter(key => !keys.includes(key)),
        );
    };
    const handleSelect = (_event: React.SyntheticEvent, key: string) => {
        const node = nodesByKey[key];
        if (node) {
            onSelect(node.question);
        }
    };
    const handleMove = useCallback(
        (offset: number) => {
            // without a visible selection, start from the first question
            const node =
                position === -1
                    ? selectableNodes[0]
                    : selectableNodes[position + offset];
            if (node) {
                onSelect(node.question);
            }
        },
        [selectableNodes, position, onSelect],
    );

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!event.altKey) {
                return;
            }
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                handleMove(1);
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                handleMove(-1);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleMove]);

    useEffect(() => {
        treeRef.current
            ?.querySelector('[aria-selected="true"]')
            ?.scrollIntoView({ block: 'nearest' });
    }, [selectedKey]);

    return (
        <Paper sx={styles.root}>
            <Box sx={styles.header}>
                <Typography variant="h6" color="primary" sx={styles.title}>
                    {formatMessage(MESSAGES.questions)}
                </Typography>
                {position !== -1 && (
                    <Typography variant="caption" sx={styles.position}>
                        {formatMessage(MESSAGES.questionPosition, {
                            position: position + 1,
                            total: selectableNodes.length,
                        })}
                    </Typography>
                )}
                <Tooltip title={formatMessage(MESSAGES.previousQuestion)}>
                    <span>
                        <IconButton
                            size="small"
                            aria-label={formatMessage(
                                MESSAGES.previousQuestion,
                            )}
                            disabled={position <= 0}
                            onClick={() => handleMove(-1)}
                        >
                            <ChevronLeft />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title={formatMessage(MESSAGES.nextQuestion)}>
                    <span>
                        <IconButton
                            size="small"
                            aria-label={formatMessage(MESSAGES.nextQuestion)}
                            disabled={position >= selectableNodes.length - 1}
                            onClick={() => handleMove(1)}
                        >
                            <ChevronRight />
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>
            <Box sx={styles.filters}>
                <InputComponent
                    keyValue="search"
                    type="search"
                    label={MESSAGES.searchQuestion}
                    value={search}
                    onChange={handleSearchChange}
                    withMarginTop={false}
                />
                <StatusFilterChips
                    statuses={statuses}
                    counts={counts}
                    onChange={handleStatusesChange}
                />
            </Box>
            <Divider />
            <Box sx={styles.tree}>
                {visibleNodes.length === 0 ? (
                    <Typography variant="body2" sx={styles.noMatch}>
                        {formatMessage(MESSAGES.noQuestionMatches)}
                    </Typography>
                ) : (
                    <TreeView
                        ref={treeRef}
                        aria-label={formatMessage(MESSAGES.questions)}
                        defaultCollapseIcon={<ExpandMore />}
                        defaultExpandIcon={<KeyboardArrowRight />}
                        expanded={expandedKeys}
                        selected={selectedKey ?? null}
                        onNodeToggle={handleToggle}
                        onNodeSelect={handleSelect}
                    >
                        {visibleNodes.map(renderNode)}
                    </TreeView>
                )}
            </Box>
        </Paper>
    );
};
