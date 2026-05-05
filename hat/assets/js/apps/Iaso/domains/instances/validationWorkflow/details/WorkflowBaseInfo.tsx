import React, { FunctionComponent, ReactNode, useCallback } from 'react';
import {
    Table,
    TableBody,
    TableRow,
    TableCell,
    Divider,
    Box,
    Button,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    textPlaceholder,
    useRedirectToReplace,
    useSafeIntl,
} from 'bluesquare-components';
import {
    useApiValidationWorkflowsCreate,
    useApiValidationWorkflowsUpdate,
    ValidationWorkflowRetrieveOutput,
} from 'Iaso/api/validationWorkflows';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { useAsyncInitialState } from 'Iaso/hooks/useAsyncInitialState';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import MESSAGES from '../../messages';

const useStyles = makeStyles(theme => ({
    leftCell: {
        // @ts-ignore
        borderRight: `1px solid ${theme.palette.ligthGray.border}`,
        fontWeight: 'bold',
        root: {
            position: 'relative',
            '& #input-text-name': {
                paddingRight: theme.spacing(15),
            },
        },
        button: {
            position: 'absolute !important',
            right: theme.spacing(3),
            top: 26,
        },
    },
}));
type RowProps = {
    label: string;
    value?: string | ReactNode;
};

const Row: FunctionComponent<RowProps> = ({ label, value }) => {
    const classes = useStyles();
    return (
        <TableRow>
            <TableCell
                className={classes.leftCell}
                sx={{ wordBreak: 'break-word' }}
            >
                {label}
            </TableCell>
            <TableCell sx={{ wordBreak: 'break-word' }}>{value}</TableCell>
        </TableRow>
    );
};

type Props = { workflow?: ValidationWorkflowRetrieveOutput };

export const WorkflowBaseInfo = ({ workflow }: Props) => {
    const params = useParamsObject(baseUrls.instanceValidationDetail);
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const [name, setName] = useAsyncInitialState<string>(workflow?.name);
    const [description, setDescription] = useAsyncInitialState<string>(
        workflow?.description,
    );
    const redirectToReplace = useRedirectToReplace();
    const { mutateAsync: mutateAsyncCreate } =
        useApiValidationWorkflowsCreate();
    const { mutateAsync: mutateAsyncSave } = useApiValidationWorkflowsUpdate();

    const save = useCallback(() => {
        if (workflow) {
            return mutateAsyncSave({
                slug: workflow.slug,
                data: { name, description },
            });
        }
        return mutateAsyncCreate(
            { data: { name, description } },
            {
                onSuccess: data =>
                    redirectToReplace(baseUrls.instanceValidationDetail, {
                        ...params,
                        slug: data.slug,
                    }),
            },
        );
    }, [
        description,
        mutateAsyncCreate,
        mutateAsyncSave,
        name,
        params,
        redirectToReplace,
        workflow,
    ]);

    // TODO add trim()
    const hasChange =
        (name && name !== workflow?.name) ||
        (description && description !== workflow?.description);

    return (
        <>
            <Box p={2} className={classes.root}>
                <InputComponent
                    withMarginTop={false}
                    keyValue="name"
                    onChange={(_, value) => setName(value)}
                    value={name}
                    type="text"
                    label={MESSAGES.name}
                    required
                />
                <InputComponent
                    withMarginTop
                    keyValue="description"
                    onChange={(_, value) => setDescription(value)}
                    value={description}
                    type="text"
                    label={MESSAGES.description}
                />
            </Box>
            <Divider />
            <Table size="small" data-testid="workflow-base-info">
                <TableBody>
                    <Row
                        label={formatMessage(MESSAGES.created_by)}
                        value={workflow?.created_by}
                    />
                    <Row
                        label={formatMessage(MESSAGES.updated_at)}
                        value={workflow?.updated_at}
                    />
                    <Row
                        label={formatMessage(MESSAGES.forms)}
                        value={
                            workflow?.forms?.map(f => f.label).join(', ') ||
                            textPlaceholder
                        }
                    />
                </TableBody>
            </Table>
            <Divider />
            <Box p={2} display="flex" justifyContent="flex-end">
                <Button
                    onClick={() => {
                        save();
                    }}
                    variant="contained"
                    disabled={!hasChange}
                >
                    {formatMessage(MESSAGES.save)}
                </Button>
            </Box>
        </>
    );
};
