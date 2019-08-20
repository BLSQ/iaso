import React from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';


import PropTypes from 'prop-types';
import { setCurrentTile } from '../../redux/mapReducer';


const MESSAGES = {
    osm: {
        id: 'iaso.tile.osm',
        defaultMessage: 'OSM',
    }
}

function TileSwitchComponent(props) {
    const {
        currentTile,
    } = props;
    return (
        <Grid container spacing={4}>
            <Grid item xs={1} />
            <Grid item xs={5}>
                <InputComponent
                    keyValue="name"
                    onChange={onChangeInfo}
                    value={orgUnit.name}
                />
                <InputComponent
                    keyValue="aliases"
                    onChange={onChangeInfo}
                    value={orgUnit.aliases}
                    type="arrayInput"
                />
                <InputComponent
                    keyValue="org_unit_type_id"
                    onChange={onChangeInfo}
                    value={orgUnit.org_unit_type_id}
                    type="select"
                    options={
                        orgUnitTypes.map(t => ({
                            label: t.name,
                            value: t.id,
                        }))
                    }
                />
                <InputComponent
                    keyValue="source"
                    onChange={onChangeInfo}
                    value={orgUnit.source}
                    type="select"
                    options={
                        sourceTypes.map(s => ({
                            label: formatMessage(MESSAGES[s[0]]),
                            value: s[0],
                        }))
                    }
                />
                <InputComponent
                    keyValue="status"
                    isClearable={false}
                    onChange={onChangeInfo}
                    value={orgUnit.status}
                    type="select"
                    options={
                        [
                            {
                                label: formatMessage(MESSAGES.validated),
                                value: true,
                            },
                            {
                                label: formatMessage(MESSAGES.notValidated),
                                value: false,
                            },
                        ]
                    }
                />
            </Grid>
            <Grid item xs={5}>
                <InputComponent
                    keyValue="source_ref"
                    value={orgUnit.source_ref}
                    disabled
                />
                <InputComponent
                    keyValue="created_at"
                    value={moment.unix(orgUnit.created_at).format('DD/MM/YYYY HH:mm')}
                    disabled
                />
                <InputComponent
                    keyValue="updated_at"
                    value={moment.unix(orgUnit.updated_at).format('DD/MM/YYYY HH:mm')}
                    disabled
                />
            </Grid>
            <Grid item xs={1} />
        </Grid>
    );
}

TileSwitchComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    currentTile: PropTypes.object.isRequired,
    setCurrentTile: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    currentTile: state.map.currentTile,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setCurrentTile: currentTile => dispatch(setCurrentTile(currentTile)),
});

export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(TileSwitchComponent));
