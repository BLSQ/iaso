import React from 'react';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import {
    AddButton as AddButtonComponent,
    useSafeIntl,
} from 'bluesquare-components';
import InputComponent from '../../../components/forms/InputComponent.tsx';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import IasoSearchComponent from './IasoSearchComponent';
import Dhis2Search from './Dhis2SearchComponent';
import MESSAGES from '../messages';
import { mappingTypeOptions } from './MappingTypeOptions';
import { useDataSources, useCreateMappingMutation } from '../hooks.js';

const CreateMappingVersionDialogComponent = () => {
    const createMappingRequest = useCreateMappingMutation();
    const dataSourcesRequest = useDataSources();
    const { formatMessage } = useSafeIntl();
    const [mappingType, setMappingType] = React.useState('AGGREGATE');
    const [source, setSource] = React.useState(0);
    const [formVersion, setFormVersion] = React.useState(0);
    const [dataset, setDataset] = React.useState(0);

    const onConfirm = closeDialog => {
        const payload = {
            form_version: { id: formVersion },
            mapping: { type: mappingType, datasource: { id: source } },
        };
        if (mappingType === 'AGGREGATE') {
            payload.dataset = dataset;
        } else if (mappingType === 'EVENT' || mappingType === 'EVENT_TRACKER') {
            payload.program = dataset;
        }

        createMappingRequest.mutate(payload).then(() => {
            closeDialog();
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
                    onChange={(key, value) => setMappingType(value)}
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
                            {dataSourcesRequest.data.map(s => (
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
                        mapOptions={options =>
                            options.map(o => ({
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
                        onChange={(name, val) => {
                            setFormVersion(val.id);
                        }}
                    />
                </Grid>
                <Grid>
                    <Dhis2Search
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
                        mapOptions={options => {
                            return options
                                .filter(o => o !== undefined)
                                .map(o => ({
                                    name: `${o.name} (${o.periodType} ${o.id})`,
                                    id: o.id,
                                }));
                        }}
                        dataSourceId={source}
                        onChange={(name, val) => {
                            setDataset(val);
                        }}
                    />
                </Grid>
            </Grid>
        </ConfirmCancelDialogComponent>
    );
};

export default CreateMappingVersionDialogComponent;
