import React from 'react';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import Grid from '@material-ui/core/Grid';
import InputComponent from '../../../components/forms/InputComponent';
import AddButtonComponent from '../../../components/buttons/AddButtonComponent';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import IasoSearchComponent from './IasoSearchComponent';
import Dhis2Search from './Dhis2SearchComponent';
import {
    createMappingRequest as createMappingRequestAction,
    fetchSources as fetchSourcesAction,
} from '../actions';
import MESSAGES from '../messages';

const mappingTypeOptions = [
    {
        value: 'AGGREGATE',
        label: MESSAGES.aggregate,
    },
    {
        value: 'EVENT',
        label: MESSAGES.event,
    },
    {
        value: 'EVENT_TRACKER',
        label: MESSAGES.eventTracker,
    },
];

const CreateMappingVersionDialogComponent = ({
    createMappingRequest,
    fetchSources,
    mappingSources,
}) => {
    const [mappingType, setMappingType] = React.useState('AGGREGATE');
    const [source, setSource] = React.useState(0);
    const [formVersion, setFormVersion] = React.useState(0);
    const [dataset, setDataset] = React.useState(0);

    React.useEffect(() => {
        fetchSources();
    }, []);

    const onConfirm = closeDialog => {
        const payload = {
            form_version: { id: formVersion },
            mapping: { type: mappingType, datasource: { id: source } },
        };
        if (mappingType === 'AGGREGATE') {
            payload.dataset = dataset;
        } else if (mappingType === 'EVENT' || mappingType == 'EVENT_TRACKER') {
            payload.program = dataset;
        }

        createMappingRequest(payload).then(() => {
            closeDialog();
        });
    };
    const onClosed = () => {
        setFormVersion(null);
    };

    return (
        <ConfirmCancelDialogComponent
            renderTrigger={({ openDialog }) => (
                <AddButtonComponent onClick={openDialog} />
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
                {mappingSources && (
                    <Grid>
                        <TextField
                            style={{ marginTop: '30px' }}
                            select
                            fullWidth
                            label="Source"
                            variant="outlined"
                            onChange={event => {
                                setSource(event.target.value);
                            }}
                        >
                            {mappingSources.map(s => (
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
                        label="Form version"
                        fields="id,form_name,version_id,mapped"
                        mapOptions={options =>
                            options.map(o => ({
                                name: [
                                    o.form_name,
                                    o.version_id,
                                    o.mapped === true
                                        ? 'at least a mapping'
                                        : 'no mapping',
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
                            mappingType === 'AGGREGATE' ? 'dataSet' : 'program'
                        }
                        mapOptions={options =>
                            options.map(o => ({
                                name: `${o.name} (${o.periodType} ${o.id})`,
                                id: o.id,
                            }))
                        }
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

CreateMappingVersionDialogComponent.propTypes = {
    createMappingRequest: PropTypes.func.isRequired,
    fetchSources: PropTypes.func.isRequired,
    mappingSources: PropTypes.array.isRequired,
};

const MapStateToProps = state => ({
    mappingSources: state.mappings.mappingSources,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    ...bindActionCreators(
        {
            createMappingRequest: createMappingRequestAction,
            fetchSources: fetchSourcesAction,
        },
        dispatch,
    ),
});

export default connect(
    MapStateToProps,
    MapDispatchToProps,
)(CreateMappingVersionDialogComponent);
