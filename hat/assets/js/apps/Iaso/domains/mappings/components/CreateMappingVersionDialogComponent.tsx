import React, { FunctionComponent } from 'react';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import {
    AddButton as AddButtonComponent,
    useSafeIntl,
} from 'bluesquare-components';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../components/forms/InputComponent';
import {
    CreateMappingPayload,
    useCreateMappingMutation,
    useDataSources,
} from '../hooks';
import MESSAGES from '../messages';
import Dhis2Search from './Dhis2SearchComponent';
import IasoSearchComponent from './IasoSearchComponent';
import { mappingTypeOptions } from './MappingTypeOptions';

type DataSourceOption = {
    id: number;
    name: string;
};

const CreateMappingVersionDialogComponent: FunctionComponent = () => {
    const createMappingRequest = useCreateMappingMutation();
    const dataSourcesRequest = useDataSources();
    const { formatMessage } = useSafeIntl();
    const [mappingType, setMappingType] = React.useState('AGGREGATE');
    const [source, setSource] = React.useState<number | string>(0);
    const [formVersion, setFormVersion] = React.useState<number | null>(0);
    // starts as 0; after DHIS2 search it becomes the selected option object
    const [dataset, setDataset] = React.useState<any>(0);

    const onConfirm = (closeDialog: () => void) => {
        const payload: CreateMappingPayload = {
            form_version: { id: formVersion as number },
            mapping: {
                type: mappingType,
                datasource: { id: source as number },
            },
        };
        if (mappingType === 'AGGREGATE') {
            payload.dataset = dataset;
        } else if (mappingType === 'EVENT' || mappingType === 'EVENT_TRACKER') {
            payload.program = dataset;
        }

        createMappingRequest.mutate(payload, {
            onSuccess: () => {
                closeDialog();
            },
        });
    };
    const onClosed = () => {
        setFormVersion(null);
    };

    return (
        <ConfirmCancelDialogComponent
            renderTrigger={({ openDialog }) => (
                <AddButtonComponent
                    onClick={openDialog}
                    dataTestId="create-mapping"
                />
            )}
            titleMessage={MESSAGES.createMapping}
            onConfirm={onConfirm}
            confirmMessage={MESSAGES.add}
            onClosed={onClosed}
            cancelMessage={MESSAGES.cancel}
            maxWidth="md"
        >
            <Grid container spacing={1} direction="column">
                <InputComponent
                    keyValue="mapping_type"
                    onChange={(_key: string, value: string) =>
                        setMappingType(value)
                    }
                    value={mappingType}
                    type="select"
                    options={mappingTypeOptions}
                    label={MESSAGES.mappingType}
                />
                {dataSourcesRequest.data && (
                    <Grid>
                        <TextField
                            style={{ marginTop: '30px' }}
                            select
                            fullWidth
                            label={formatMessage(MESSAGES.source)}
                            variant="outlined"
                            onChange={event => {
                                setSource(event.target.value);
                            }}
                        >
                            {(
                                dataSourcesRequest.data as DataSourceOption[]
                            ).map((s: DataSourceOption) => (
                                <MenuItem key={s.id} value={s.id}>
                                    {s.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                )}
                <Grid>
                    <IasoSearchComponent
                        resourceName="formversions"
                        collectionName="form_versions"
                        label={formatMessage(MESSAGES.formVersion)}
                        fields="id,form_name,version_id,mapped"
                        placeholder={formatMessage(
                            MESSAGES.startTypingFormVersion,
                        )}
                        mapOptions={(options: any[]) =>
                            options.map((o: any) => ({
                                name: [
                                    o.form_name,
                                    o.version_id,
                                    o.mapped === true
                                        ? formatMessage(
                                              MESSAGES.atLeastAMapping,
                                          )
                                        : formatMessage(MESSAGES.noMapping),
                                ].join(' - '),
                                id: o.id,
                            }))
                        }
                        onChange={(_name: string, val: any) => {
                            setFormVersion(val.id);
                        }}
                    />
                </Grid>
                <Grid>
                    <Dhis2Search
                        disabled={!source}
                        placeholder={formatMessage(MESSAGES.startTypingDataset)}
                        key={`${mappingType} ${source}`}
                        resourceName={
                            mappingType === 'AGGREGATE'
                                ? 'dataSets'
                                : 'programs'
                        }
                        fields="id,name,periodType"
                        label={
                            mappingType === 'AGGREGATE'
                                ? formatMessage(MESSAGES.dataset)
                                : formatMessage(MESSAGES.program)
                        }
                        mapOptions={(options: any[]) => {
                            return options
                                .filter((o: any) => o !== undefined)
                                .map((o: any) => ({
                                    name: `${o.name} (${o.periodType} ${o.id})`,
                                    id: o.id,
                                }));
                        }}
                        dataSourceId={source}
                        onChange={(_name: string, val: any) => {
                            setDataset(val);
                        }}
                    />
                </Grid>
            </Grid>
        </ConfirmCancelDialogComponent>
    );
};

export default CreateMappingVersionDialogComponent;
