/* eslint-disable react/jsx-indent */
import React, { useMemo, FunctionComponent, JSX } from 'react';
import CommentIcon from '@mui/icons-material/Comment';
import FunctionsIcon from '@mui/icons-material/Functions';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Tooltip,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { textPlaceholder } from 'bluesquare-components';
import DocumentsItemComponent from 'Iaso/components/files/DocumentsItemComponent';
import VideoItemComponent from 'Iaso/components/files/VideoItemComponent';
import {
    slugifyValue,
    translateLabel,
} from 'Iaso/domains/instances/utils/questions';
import { getFileName, getFileType } from 'Iaso/utils/filesUtils';
import { useLocale } from '../../app/contexts/LocaleContext';
import { InstanceImagePreview } from './InstanceImagePreview';

// Define types for the component
export type Descriptor = {
    name: string;
    type: string;
    label?: Record<string, string> | string;
    children?: Descriptor[];
    bind?: {
        calculate?: string;
    };
};

type Data = Record<string, any>;

type LabelProps = {
    descriptor: Descriptor;
    value?: string | number | null;
    tooltip?: string | null;
    showQuestionKey?: boolean;
};

type FormFieldProps = {
    descriptor: Descriptor;
    data: Data;
    showQuestionKey?: boolean;
};

type FormCalculatedFieldProps = FormFieldProps;
type FormMetaFieldProps = FormFieldProps;
type FormNoteFieldProps = {
    descriptor: Descriptor;
    showQuestionKey?: boolean;
};

type PhotoFieldProps = {
    descriptor: Descriptor;
    data: Data;
    showQuestionKey?: boolean;
    files?: string[];
};

type FileFieldProps = {
    descriptor: Descriptor;
    data: Data;
    showQuestionKey?: boolean;
    files?: string[];
};

type FormChildProps = {
    descriptor: Descriptor;
    data: Data;
    showQuestionKey?: boolean;
    showNote?: boolean;
    files?: string[];
};

type FormGroupProps = {
    descriptor: Descriptor;
    data: Data;
    showQuestionKey?: boolean;
    files?: string[];
};

type InstanceFileContentRichProps = {
    instanceData: Data;
    formDescriptor: Descriptor;
    showQuestionKey?: boolean;
    showNote?: boolean;
    files?: string[];
};

const useStyles = makeStyles(theme => ({
    tableCellHead: {
        fontWeight: 'bold',
        // @ts-ignore
        backgroundColor: theme.palette.gray,
        borderTop: 'none !important',
        borderLeft: 'none !important',
        borderRight: 'none !important',
        // @ts-ignore
        borderBottom: `1px solid ${theme.palette.ligthGray.border}  !important`,
    },
    tableCell: {
        backgroundColor: 'transparent',
        borderTop: 'none !important',
        borderLeft: 'none !important',
        borderRight: 'none !important',
        // @ts-ignore
        borderBottom: `1px solid ${theme.palette.ligthGray.border}  !important`,
    },
    tableCellCalculated: {
        // @ts-ignore
        color: theme.palette.gray.main,
    },
    tableCellLabelWrapper: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },
    tableCellLabelIcon: {
        alignSelf: 'flex-start',
    },
    tableCellLabel: {
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        marginLeft: 5,
    },
    tableCellLabelName: {
        // @ts-ignore
        color: theme.palette.mediumGray.main,
    },
}));

const getRawValue = (descriptor: Descriptor, data: Data): string => {
    const value = data[descriptor.name];
    if (value === undefined) {
        return textPlaceholder;
    }
    return value;
};

/**
 * Extract the value from data using the descriptor
 * (handles the different scenarios, such as select fields)
 */

const getDisplayedValue = (
    descriptor: Descriptor,
    data: Data,
    activeLocale: string,
): string => {
    const value = data[descriptor.name];
    if (value === undefined) {
        return textPlaceholder;
    }
    switch (descriptor.type) {
        case 'select_one':
        case 'select one': {
            const choice = descriptor.children?.find(c => c.name === value);
            return choice !== undefined
                ? translateLabel(choice.label || '', activeLocale)
                : `${value} (choice not found)`;
        }
        case 'select_all_that_apply':
        case 'select all that apply':
        case 'select_multiple':
        case 'select multiple': {
            const choices =
                descriptor.children?.filter(c =>
                    (value as string).split(' ').includes(c.name),
                ) || [];
            return choices.length > 0
                ? choices
                      .map(choice =>
                          translateLabel(choice.label || '', activeLocale),
                      )
                      .join(', ')
                : `${value} (multi choice not found)`;
        }
        default:
            return value !== '' ? value : textPlaceholder;
    }
};

const InstanceFileContentRich: FunctionComponent<
    InstanceFileContentRichProps
> = ({
    instanceData,
    formDescriptor,
    showQuestionKey = true,
    showNote = true,
    files = [],
}) => {
    return (
        <Table>
            <TableBody>
                {formDescriptor.children
                    ?.filter(c => c.name !== 'meta')
                    .map(childDescriptor => (
                        <FormChild
                            key={childDescriptor.name}
                            descriptor={childDescriptor}
                            data={instanceData}
                            showQuestionKey={showQuestionKey}
                            showNote={showNote}
                            files={files}
                        />
                    ))}
            </TableBody>
        </Table>
    );
};

const PhotoField: FunctionComponent<PhotoFieldProps> = ({
    descriptor,
    data,
    showQuestionKey = true,
    files = [],
}) => {
    const classes = useStyles();
    const value = data[descriptor.name];
    const fileUrl = useMemo(() => {
        if (value && files.length > 0) {
            const slugifiedValue = slugifyValue(value);
            return files.find(f => {
                if (slugifiedValue.endsWith('jpg')) {
                    return (
                        f.includes(slugifiedValue) ||
                        f.includes(slugifiedValue.replace('.jpg', '.webp'))
                    );
                }
                return f.includes(slugifiedValue);
            });
        }
        return null;
    }, [value, files]);
    return (
        <TableRow>
            <TableCell className={classes.tableCell}>
                <Label
                    descriptor={descriptor}
                    showQuestionKey={showQuestionKey}
                />
            </TableCell>
            <TableCell
                className={classes.tableCell}
                align="right"
                title={getRawValue(descriptor, data)}
            >
                {value && fileUrl && (
                    <InstanceImagePreview
                        imageUrl={fileUrl}
                        altText={descriptor.name}
                    />
                )}
                {(!value || !fileUrl) && textPlaceholder}
            </TableCell>
        </TableRow>
    );
};

const FileField: FunctionComponent<FileFieldProps> = ({
    descriptor,
    data,
    showQuestionKey = true,
    files = [],
}) => {
    const classes = useStyles();
    const value = data[descriptor.name];

    const fileUrl = useMemo(() => {
        if (value && files.length > 0) {
            const slugifiedValue = slugifyValue(value);
            return files.find(f => f.includes(slugifiedValue));
        }
        return null;
    }, [value, files]);
    const fileName = value ? getFileName(value) : undefined;
    const fileType = fileName ? getFileType(fileName) : undefined;

    return (
        <TableRow>
            <TableCell className={classes.tableCell}>
                <Label
                    descriptor={descriptor}
                    showQuestionKey={showQuestionKey}
                />
            </TableCell>
            <TableCell
                className={classes.tableCell}
                align="right"
                title={getRawValue(descriptor, data)}
            >
                {value && fileUrl && fileName && (
                    <>
                        {fileType === 'image' && (
                            <InstanceImagePreview
                                imageUrl={fileUrl}
                                altText={descriptor.name}
                            />
                        )}
                        {fileType === 'video' && (
                            <Box sx={{ height: '200px' }}>
                                <VideoItemComponent
                                    videoPath={fileUrl}
                                    fileInfo={fileName.name}
                                />
                            </Box>
                        )}
                        {(fileType === 'document' || fileType === 'other') && (
                            <Box sx={{ float: 'right', width: '150px' }}>
                                <DocumentsItemComponent filePath={fileUrl} />
                            </Box>
                        )}
                    </>
                )}
                {(!value || !fileUrl) && textPlaceholder}
            </TableCell>
        </TableRow>
    );
};

const FormChild = ({
    descriptor,
    data,
    showQuestionKey = true,
    showNote = true,
    files = [],
}: FormChildProps): JSX.Element | null => {
    switch (descriptor.type) {
        case 'repeat':
            return data[descriptor.name] ? (
                <>
                    {(data[descriptor.name] as Data[]).map(subdata => (
                        <FormGroup
                            key={descriptor.name}
                            descriptor={descriptor}
                            data={subdata}
                            showQuestionKey={showQuestionKey}
                            files={files}
                        />
                    ))}
                </>
            ) : null;
        case 'group':
            return (
                <FormGroup
                    descriptor={descriptor}
                    data={data}
                    showQuestionKey={showQuestionKey}
                    files={files}
                />
            );
        case 'deviceid':
        case 'subscriberid':
        case 'simserial':
        case 'phonenumber':
            return (
                <FormMetaField
                    descriptor={descriptor}
                    data={data}
                    showQuestionKey={showQuestionKey}
                />
            );
        case 'note':
            return showNote ? (
                <FormNoteField
                    descriptor={descriptor}
                    showQuestionKey={showQuestionKey}
                />
            ) : null;
        case 'photo':
        case 'image':
            return (
                <PhotoField
                    descriptor={descriptor}
                    data={data}
                    showQuestionKey={showQuestionKey}
                    files={files}
                />
            );
        case 'file':
            return (
                <FileField
                    descriptor={descriptor}
                    data={data}
                    showQuestionKey={showQuestionKey}
                    files={files}
                />
            );
        case 'calculate':
            return (
                <FormCalculatedField
                    descriptor={descriptor}
                    data={data}
                    showQuestionKey={showQuestionKey}
                />
            );
        default:
            return (
                <FormField
                    descriptor={descriptor}
                    data={data}
                    showQuestionKey={showQuestionKey}
                />
            );
    }
};

const FormGroup: FunctionComponent<FormGroupProps> = ({
    descriptor,
    data,
    showQuestionKey = true,
    files = [],
}) => {
    const classes = useStyles();

    return (
        <>
            <TableRow>
                <TableCell
                    colSpan={2}
                    align="center"
                    className={classes.tableCellHead}
                >
                    <Label
                        descriptor={descriptor}
                        showQuestionKey={showQuestionKey}
                    />
                </TableCell>
            </TableRow>
            {descriptor.children?.map(childDescriptor => (
                <FormChild
                    key={childDescriptor.name}
                    descriptor={childDescriptor}
                    data={data}
                    showQuestionKey={showQuestionKey}
                    files={files}
                />
            ))}
        </>
    );
};

const FormField: FunctionComponent<FormFieldProps> = ({
    descriptor,
    data,
    showQuestionKey = true,
}) => {
    const classes = useStyles();
    const { locale: activeLocale } = useLocale();

    return (
        <TableRow>
            <TableCell className={classes.tableCell}>
                <Label
                    descriptor={descriptor}
                    showQuestionKey={showQuestionKey}
                />
            </TableCell>
            <TableCell
                className={classes.tableCell}
                align="right"
                title={getRawValue(descriptor, data)}
            >
                {getDisplayedValue(descriptor, data, activeLocale)}
            </TableCell>
        </TableRow>
    );
};

const FormCalculatedField: FunctionComponent<FormCalculatedFieldProps> = ({
    descriptor,
    data,
    showQuestionKey = true,
}) => {
    const classes = useStyles();
    const { locale: activeLocale } = useLocale();

    return (
        <TableRow>
            <TableCell className={classes.tableCell}>
                <div className={classes.tableCellLabelWrapper}>
                    <FunctionsIcon
                        color="disabled"
                        className={classes.tableCellLabelIcon}
                    />
                    <Label
                        descriptor={descriptor}
                        tooltip={descriptor.bind?.calculate || null}
                        showQuestionKey={showQuestionKey}
                    />
                </div>
            </TableCell>
            <TableCell className={classes.tableCell} align="right">
                {getDisplayedValue(descriptor, data, activeLocale)}
            </TableCell>
        </TableRow>
    );
};

const FormMetaField: FunctionComponent<FormMetaFieldProps> = ({
    descriptor,
    data,
    showQuestionKey = true,
}) => {
    const classes = useStyles();
    const { locale: activeLocale } = useLocale();

    return (
        <TableRow>
            <TableCell className={classes.tableCell} colSpan={2}>
                <Label
                    descriptor={descriptor}
                    value={getDisplayedValue(descriptor, data, activeLocale)}
                    showQuestionKey={showQuestionKey}
                />
            </TableCell>
        </TableRow>
    );
};

const FormNoteField: FunctionComponent<FormNoteFieldProps> = ({
    descriptor,
    showQuestionKey = true,
}) => {
    const classes = useStyles();

    return (
        <TableRow>
            <TableCell className={classes.tableCell} colSpan={2}>
                <div className={classes.tableCellLabelWrapper}>
                    <CommentIcon
                        color="disabled"
                        className={classes.tableCellLabelIcon}
                    />
                    <Label
                        descriptor={descriptor}
                        showQuestionKey={showQuestionKey}
                    />
                </div>
            </TableCell>
        </TableRow>
    );
};

const Label: FunctionComponent<LabelProps> = ({
    descriptor,
    value = null,
    tooltip = null,
    showQuestionKey = true,
}) => {
    const classes = useStyles();
    const { locale: activeLocale } = useLocale();

    let label = descriptor.name;
    let showNameHint = false;
    if ('label' in descriptor) {
        label = translateLabel(descriptor.label || '', activeLocale);

        if (value !== null) {
            // useful for meta questions, whose labels are like "subscriberid ${subscriberid}"
            label = label.replace(`\${${descriptor.name}}`, value.toString());
        } else {
            showNameHint = true;
        }
    }

    const labelElement = (
        <div className={classes.tableCellLabel}>
            {label.replace(/(<([^>]+)>)/gi, '')}
            {showQuestionKey
                ? showNameHint && (
                      <div className={classes.tableCellLabelName}>
                          {descriptor.name}
                      </div>
                  )
                : null}
        </div>
    );

    return tooltip === null ? (
        labelElement
    ) : (
        <Tooltip placement="right-start" title={tooltip}>
            {labelElement}
        </Tooltip>
    );
};

export default InstanceFileContentRich;
