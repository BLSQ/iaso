import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    projects: {
        defaultMessage: 'Projects',
        id: 'iaso.label.projects',
    },
    create: {
        defaultMessage: 'Create project',
        id: 'iaso.projects.create',
    },
    projectName: {
        defaultMessage: 'Project name',
        id: 'iaso.projects.name',
    },
    appId: {
        defaultMessage: 'App ID',
        id: 'iaso.projects.appId',
    },
    needsAuthentication: {
        defaultMessage: 'Requires Authentication',
        id: 'iaso.projects.needsAuthentication',
    },
    true: {
        defaultMessage: 'User needs authentication',
        id: 'iaso.projects.true',
    },
    false: {
        defaultMessage: "User doesn't need authentication",
        id: 'iaso.projects.false',
    },
    featureFlags: {
        defaultMessage: 'Feature flags',
        id: 'iaso.label.featureFlags',
    },
    updateProject: {
        defaultMessage: 'Update project',
        id: 'iaso.projects.update',
    },
    actions: {
        defaultMessage: 'Action(s)',
        id: 'iaso.label.actions',
    },
    edit: {
        defaultMessage: 'Edit',
        id: 'iaso.label.edit',
    },
    infos: {
        defaultMessage: 'Infos',
        id: 'iaso.orgUnits.infos',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    save: {
        id: 'iaso.label.save',
        defaultMessage: 'Save',
    },
    appIdError: {
        id: 'iaso.projets.label.appIdError',
        defaultMessage:
            '", ?, /, %, &, - and whitespace are not allowed in app id',
    },
    require_authentication_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.require_authentication',
        defaultMessage:
            'Users have to enter their login and password on the mobile application before proceeding to the data collection',
    },
    reports_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.reports',
        defaultMessage:
            'Tab enabling the feature to collect data from the IASO mobile application',
    },
    take_gps_on_form_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.take_gps_on_form',
        defaultMessage:
            'A GPS point is automatically taken and associated to the form submission',
    },
    transport_tracking_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.transport_tracking',
        defaultMessage:
            'Users have to be 50m away max to the Org Unit GPS  point for the form to open',
    },
    gps_tracking_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.gps_tracking',
        defaultMessage:
            'Tab enabling to see the assigned data collection points via the Planning feature',
    },
    check_position_for_forms_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.check_position_for_forms',
        defaultMessage:
            'Downloads only the geo data of the zone assigned to the user (for offline use)',
    },
    mobile_finalized_form_are_read_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.mobile_finalized_form_are_read',
        defaultMessage:
            'Tab in the mobile application to show the geographic information available for the selected Org Unit',
    },
    limit_ou_download_to_roots_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.limit_ou_download_to_roots',
        defaultMessage:
            'Propose changes to org units and their related reference form(s)',
    },
    data_collection_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.data_collection',
        defaultMessage:
            'Tab enabling to propose changes to org units and their reference form(s)',
    },
    entity_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.entity',
        defaultMessage:
            "Track the user's position every 15 minutes over a period of time",
    },
    show_detail_map_on_mobile_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.show_detail_map_on_mobile',
        defaultMessage:
            'Notify the user when new form versions have been uploaded on the web',
    },
    planning_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.planning',
        defaultMessage:
            'Notify and force the user to update when new form versions have been uploaded on the web',
    },
    mobile_check_forms_update_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.mobile_check_forms_update',
        defaultMessage:
            'Notify the user when changes to the geo data (Org units) have been done on the web',
    },
    mobile_force_forms_update_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.mobile_force_forms_update',
        defaultMessage:
            'Notify and force the user tp update when changes to the geo data (Org units) have been done on the web',
    },
    mobile_check_ou_update_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.mobile_check_ou_update',
        defaultMessage:
            'Forms are automatically synchronized provided the user has connectivity',
    },
    mobile_force_ou_update_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.mobile_force_ou_update',
        defaultMessage:
            'Blocks the edition of forms from the mobile app once finalized',
    },
});

export default MESSAGES;
