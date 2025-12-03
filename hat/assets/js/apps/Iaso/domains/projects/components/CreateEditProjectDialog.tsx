import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { Tab, Tabs } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    AddButton,
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import get from 'lodash/get';
import { defaultProjectColor } from 'Iaso/components/LegendBuilder/colors';

import { EditIconButton } from '../../../components/Buttons/EditIconButton';
import { useGetFeatureFlags } from '../hooks/requests';
import MESSAGES from '../messages';
import { FeatureFlag } from '../types/featureFlag';
import { Project } from '../types/project';
import { ProjectFeatureFlags } from './ProjectFeatureFlags';
import { ProjectInfos, ProjectForm } from './ProjectInfos';

type Tab = 'infos' | 'feature_flags';

type Props = {
    initialData?: Project | null;
    saveProject: (s: Project) => Promise<any>;
    closeDialog: () => void;
    isOpen: boolean;
    dialogType: string;
};

const useStyles = makeStyles(theme => ({
    tabs: {
        marginBottom: theme.spacing(4),
    },
    tab: {
        padding: 0,
        width: 'calc(100% / 3)',
        minWidth: 0,
    },
    root: {
        minHeight: 365,
        position: 'relative',
    },
    hiddenOpacity: {
        position: 'absolute',
        top: 0,
        left: -5000,
        zIndex: -10,
        opacity: 0,
    },
}));

const emptyProject: ProjectForm = {
    id: { value: '', errors: [] },
    app_id: { value: '', errors: [] },
    name: { value: '', errors: [] },
    feature_flags: { value: [], errors: [] },
    qr_code: { value: '', errors: [] },
    color: { value: '', errors: [] },
};

export const forbiddenCharacters = ['"', '?', '/', '%', '&', ' ', '-'];

export const containsForbiddenCharacter = (value: string): boolean => {
    for (let i = 0; i < value.length; i += 1) {
        if (forbiddenCharacters.includes(value[i])) return true;
    }
    return false;
};

export const CreateEditProjectDialog: FunctionComponent<Props> = ({
    dialogType = 'create',
    closeDialog,
    isOpen,
    initialData = {
        name: null,
        app_id: null,
        feature_flags: [],
    },
    saveProject,
}) => {
    const { data: featureFlags, isFetching: isFetchingFeatureFlags } =
        useGetFeatureFlags();

    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const initialProject = useCallback(
        app => {
            const pr = app || initialData || {};
            return {
                id: { value: get(pr, 'id', null), errors: [] },
                app_id: { value: get(pr, 'app_id', ''), errors: [] },
                name: {
                    value: get(pr, 'name', ''),
                    errors: [],
                },
                feature_flags: {
                    value: get(pr, 'feature_flags', [] as FeatureFlag[]),
                    errors: [],
                },
                qr_code: {
                    value: get(pr, 'qr_code', ''),
                    errors: [],
                },
                color: {
                    value: get(pr, 'color', defaultProjectColor),
                    errors: [],
                },
            };
        },
        [initialData],
    );
    const [project, setProject] = useState<ProjectForm>(emptyProject);
    const [tab, setTab] = useState<Tab>('infos');
    const appIdError = formatMessage(MESSAGES.appIdError);

    const setFieldValue = useCallback(
        (fieldName, fieldValue) => {
            setProject({
                ...project,
                [fieldName]: {
                    value: fieldValue,
                    errors: [],
                },
            });
        },
        [project],
    );

    const setInfoFieldValue = useCallback(
        (fieldName, fieldValue) => {
            const errors: unknown[] = [];
            const hasForbiddenChar = containsForbiddenCharacter(fieldValue);
            if (fieldName === 'app_id' && hasForbiddenChar) {
                errors.push(appIdError);
            }
            setProject({
                ...project,
                [fieldName]: {
                    value: fieldValue,
                    errors,
                },
            });
        },
        [appIdError, project],
    );

    const setFieldErrors = useCallback(
        (fieldName, fieldError) => {
            setProject({
                ...project,
                [fieldName]: {
                    value: project[fieldName].value,
                    errors: [fieldError],
                },
            });
        },
        [project],
    );

    const translatedFeatureFlag = useCallback(
        featureFlag => {
            const translated = featureFlag;
            translated.name = MESSAGES[featureFlag.code.toLowerCase()]
                ? formatMessage(MESSAGES[featureFlag.code.toLowerCase()])
                : featureFlag.name || featureFlag.id;
            return translated;
        },
        [formatMessage],
    );

    const onConfirm = () => {
        const currentProject: Project = {
            id: initialData?.app_id,
            feature_flags: project.feature_flags.value ?? [],
            app_id: project.app_id.value || '',
            name: project.name.value || '',
            old_app_id: initialData?.app_id,
            color: project.color.value || defaultProjectColor,
        };
        saveProject(currentProject)
            .then(() => {
                setTab('infos');
                setProject(initialProject(null));
            })
            .catch(error => {
                if (error.status === 400) {
                    Object.keys(error.details).forEach(errorKey => {
                        setFieldErrors(errorKey, error.details[errorKey]);
                    });
                }
            });
    };
    useEffect(() => {
        setProject(initialProject(initialData));
    }, [initialData, initialProject]);

    const validateFeatureFlagsConfiguration = useCallback(() => {
        return (project.feature_flags.value ?? []).every(pff => {
            const ff = featureFlags?.find(x => x.id === pff.id);
            return (
                ff == null ||
                ff.configuration_schema == null ||
                Object.entries(ff.configuration_schema).every(
                    ([confKey]) =>
                        pff.configuration?.[confKey] &&
                        pff.configuration?.[confKey] !== '',
                )
            );
        });
    }, [project, featureFlags]);

    const allowConfirm = useMemo(
        () =>
            project &&
            project.name &&
            project.name.value !== '' &&
            project.app_id &&
            project.app_id.value !== '' &&
            project.app_id.errors.length === 0 &&
            !isFetchingFeatureFlags &&
            validateFeatureFlagsConfiguration(),
        [project, isFetchingFeatureFlags, validateFeatureFlagsConfiguration],
    );
    const titleMessage =
        dialogType === 'create'
            ? formatMessage(MESSAGES.create)
            : formatMessage(MESSAGES.updateProject);

    return (
        <ConfirmCancelModal
            allowConfirm={allowConfirm}
            titleMessage={titleMessage}
            onConfirm={onConfirm}
            onCancel={() => {
                setProject(initialProject(null));
                setTab('infos');
                closeDialog();
            }}
            maxWidth="sm"
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.save}
            open={isOpen}
            closeDialog={closeDialog}
            dataTestId="project-dialog"
            id="project-dialog"
            onClose={() => null}
        >
            <div className={classes.root} id="project-dialog">
                <Tabs
                    value={tab}
                    classes={{
                        root: classes.tabs,
                    }}
                    onChange={(_event, newtab) => setTab(newtab)}
                >
                    <Tab
                        classes={{
                            root: classes.tab,
                        }}
                        value="infos"
                        label={formatMessage(MESSAGES.infos)}
                    />
                    <Tab
                        classes={{
                            root: classes.tab,
                        }}
                        value="feature_flags"
                        label={formatMessage(MESSAGES.featureFlags)}
                    />
                </Tabs>
                {tab === 'infos' && (
                    <ProjectInfos
                        setFieldValue={setInfoFieldValue}
                        currentProject={project}
                    />
                )}
                {tab === 'feature_flags' && (
                    <ProjectFeatureFlags
                        onFeatureFlagsChanged={(value: FeatureFlag[]) =>
                            setFieldValue('feature_flags', value)
                        }
                        projectFeatureFlags={project.feature_flags.value ?? []}
                        featureFlags={(featureFlags ?? [])?.map(featureFlag =>
                            translatedFeatureFlag(featureFlag),
                        )}
                        isFetchingFeatureFlag={isFetchingFeatureFlags}
                    />
                )}
            </div>
        </ConfirmCancelModal>
    );
};

const createProjectModalWithButton = makeFullModal(
    CreateEditProjectDialog,
    AddButton,
);
const editProjectModalWithIcon = makeFullModal(
    CreateEditProjectDialog,
    EditIconButton,
);

export {
    createProjectModalWithButton as CreateProjectDialog,
    editProjectModalWithIcon as EditProjectDialog,
};
