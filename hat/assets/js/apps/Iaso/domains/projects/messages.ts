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
    featureFlag_DCO: {
        defaultMessage: 'Data collection options',
        id: 'iaso.projets.featureflag.category.DCO',
    },
    featureFlag_REO: {
        defaultMessage: 'Refresh options',
        id: 'iaso.projets.featureflag.category.REO',
    },
    featureFlag_GEO: {
        defaultMessage: 'Geographic options',
        id: 'iaso.projets.featureflag.category.GEO',
    },
    featureFlag_DAV: {
        defaultMessage: 'Data validation',
        id: 'iaso.projets.featureflag.category.DAV',
    },
    featureFlag_ENT: {
        defaultMessage: 'Entities',
        id: 'iaso.projets.featureflag.category.ENT',
    },
    featureFlag_PLA: {
        defaultMessage: 'Planning',
        id: 'iaso.projets.featureflag.category.PLA',
    },
    featureFlag_SPO: {
        defaultMessage: 'Specific options',
        id: 'iaso.projets.featureflag.category.SPO',
    },
    featureFlag_NA: {
        defaultMessage: 'Generics',
        id: 'iaso.projets.featureflag.category.NA',
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
    require_authentication: {
        id: 'iaso.projets.featureflag.require_authentication',
        defaultMessage: 'Authentication',
    },
    require_authentication_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.require_authentication',
        defaultMessage:
            'Users have to enter their login and password on the mobile application before proceeding to the data collection',
    },
    mobile_submission_incomplete_by_default: {
        id: 'iaso.projets.featureflag.mobile_submission_incomplete_by_default',
        defaultMessage:
            "Do not check 'finalized' by default at the end of the form",
    },
    mobile_submission_incomplete_by_default_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.mobile_submission_incomplete_by_default',
        defaultMessage:
            "Disables the feature that pre-ticks the box 'Finalized' at the end of the form",
    },
    reports: {
        id: 'iaso.projets.featureflag.reports',
        defaultMessage: 'Enable reports',
    },
    reports_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.reports',
        defaultMessage:
            'Activate the Reports feature for entities with some key indicators. Reports have to be defined beforehand for the feature to show relevant data.',
    },
    take_gps_on_form: {
        id: 'iaso.projets.featureflag.take_gps_on_form',
        defaultMessage: 'GPS on each form',
    },
    take_gps_on_form_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.take_gps_on_form',
        defaultMessage:
            'A GPS point is automatically taken and associated to the form submission',
    },
    transport_tracking: {
        id: 'iaso.projets.featureflag.transport_tracking',
        defaultMessage: 'GPS of journeys',
    },
    transport_tracking_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.transport_tracking',
        defaultMessage:
            "Track the user's position every 15 minutes over a period of time",
    },
    gps_tracking: {
        id: 'iaso.projets.featureflag.gps_tracking',
        defaultMessage: 'GPS Tracking',
    },
    gps_tracking_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.gps_tracking',
        defaultMessage: "Tracks the user's position",
    },
    mobile_org_unit_registry: {
        id: 'iaso.projets.featureflag.mobile_org_unit_registry',
        defaultMessage: 'Mobile: Change requests',
    },
    mobile_entity_warn_when_found: {
        id: 'iaso.projets.featureflag.mobile_entity_warn_when_found',
        defaultMessage:
            'Mobile: Display a message when an entity is found on the duplicate search',
    },
    mobile_entity_warn_when_found_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.mobile_entity_warn_when_found',
        defaultMessage:
            'A message prompts when an entity duplicate has been found',
    },
    check_position_for_forms: {
        id: 'iaso.projets.featureflag.check_position_for_forms',
        defaultMessage:
            'Mobile: Enforce users are within reach of the org unit before starting the form',
    },
    check_position_for_forms_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.check_position_for_forms',
        defaultMessage:
            'Users have to be 50m away max to the Org Unit GPS  point for the form to open',
    },
    mobile_finalized_form_are_read: {
        id: 'iaso.projets.featureflag.mobile_finalized_form_are_read',
        defaultMessage: 'Mobile: Finalised forms are read only',
    },
    mobile_finalized_form_are_read_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.mobile_finalized_form_are_read',
        defaultMessage:
            'Blocks the edition of forms from the mobile app once finalized',
    },
    limit_ou_download_to_roots: {
        id: 'iaso.projets.featureflag.limit_ou_download_to_roots',
        defaultMessage:
            'Mobile: Limit download of org unit to what the user has access to',
    },
    limit_ou_download_to_roots_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.limit_ou_download_to_roots',
        defaultMessage:
            'Downloads only the geo data of the zone assigned to the user (for offline use). This allows the download of less heavy data files.',
    },
    mobile_entity_limited_search: {
        id: 'iaso.projets.featureflag.mobile_entity_limited_search',
        defaultMessage: 'Mobile: Limit entities search',
    },
    mobile_entity_limited_search_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.mobile_entity_limited_search',
        defaultMessage:
            'Limits the entities search to the device level. This is avoid use of mobile data.',
    },
    mobile_org_unit_deep_search: {
        id: 'iaso.projets.featureflag.mobile_org_unit_deep_search',
        defaultMessage: 'Mobile: Search through children in OrgUnit tree.',
    },
    data_collection: {
        id: 'iaso.projets.featureflag.data_collection',
        defaultMessage: 'Mobile: show data collection screen',
    },
    data_collection_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.data_collection',
        defaultMessage:
            'Tab enabling the feature to collect data from the IASO mobile application. Useful when data collection mode is done in parallel to another tab (entities, planning, etc)',
    },
    entity: {
        id: 'iaso.projets.featureflag.entity',
        defaultMessage: 'Mobile: Show entities screen',
    },
    entity_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.entity',
        defaultMessage:
            'Tab in the mobile application for entities management and data collection',
    },
    show_detail_map_on_mobile: {
        id: 'iaso.projets.featureflag.show_detail_map_on_mobile',
        defaultMessage: 'Mobile: Show map of org unit',
    },
    show_detail_map_on_mobile_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.show_detail_map_on_mobile',
        defaultMessage:
            'Tab in the mobile application to show the geographic information available for the selected Org Unit',
    },
    planning: {
        id: 'iaso.projets.featureflag.planning',
        defaultMessage: 'Mobile: Show planning screen',
    },
    planning_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.planning',
        defaultMessage:
            'Tab enabling to see the assigned data collection points via the Planning feature. Users only see the relevant data collection points.',
    },
    mobile_entity_no_creation: {
        id: 'iaso.projets.featureflag.mobile_entity_no_creation',
        defaultMessage: 'Mobile: User cannot create a entity',
    },
    mobile_entity_no_creation_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.mobile_entity_no_creation',
        defaultMessage: 'Blocks the creation of entities by the users',
    },
    mobile_check_forms_update: {
        id: 'iaso.projets.featureflag.mobile_check_forms_update',
        defaultMessage: 'Mobile: Warn the user when forms have been updated',
    },
    mobile_check_forms_update_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.mobile_check_forms_update',
        defaultMessage:
            'Notify the user when new form versions have been uploaded on the web (provided the device has connectivity)',
    },
    mobile_force_forms_update: {
        id: 'iaso.projets.featureflag.mobile_force_forms_update',
        defaultMessage:
            'Mobile: Warn the user when forms have been updated and force them to update',
    },
    mobile_force_forms_update_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.mobile_force_forms_update',
        defaultMessage:
            'Force the user to update when new form versions have been uploaded on the web (provided the device has connectivity)',
    },
    mobile_check_ou_update: {
        id: 'iaso.projets.featureflag.mobile_check_ou_update',
        defaultMessage:
            'Mobile: Warn the user when the org units have been updated',
    },
    mobile_check_ou_update_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.mobile_check_ou_update',
        defaultMessage:
            'Notify the user when changes to the geo data (Org units) have been done on the web (provided the device has connectivity)',
    },
    mobile_force_ou_update: {
        id: 'iaso.projets.featureflag.mobile_force_ou_update',
        defaultMessage:
            'Mobile: Warn the user when the org units have been updated and force them to update',
    },
    mobile_force_ou_update_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.mobile_force_ou_update',
        defaultMessage:
            'Force the user to update when changes to the geo data (Org units) have been done on the web (provided the device has connectivity)',
    },
    org_unit_change_request: {
        id: 'iaso.projets.featureflag.org_unit_change_request',
        defaultMessage: 'Request changes to org units',
    },
    org_unit_change_request_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.org_unit_change_request',
        defaultMessage:
            'Propose changes to org units and their related reference form(s)',
    },
    show_link_instance_reference: {
        id: 'iaso.projets.featureflag.show_link_instance_reference',
        defaultMessage: 'Show link instance reference',
    },
    show_link_instance_reference_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.show_link_instance_reference',
        defaultMessage:
            'Link the organisation unit to the reference submission',
    },
    forms_auto_upload: {
        id: 'iaso.projets.featureflag.forms_auto_upload',
        defaultMessage: 'Automatic upload of finalized forms',
    },
    forms_auto_upload_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.forms_auto_upload',
        defaultMessage:
            'Finalized forms are automatically synchronized provided the user has connectivity',
    },
    write_on_nfc_cards: {
        id: 'iaso.projets.featureflag.write_on_nfc_cards',
        defaultMessage: 'Use NFC card to save entity',
    },
    write_on_nfc_cards_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.write_on_nfc_cards',
        defaultMessage:
            'Enables the possibility to save entities data on an NFC card',
    },
    mobile_change_requests_tab_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.mobile_change_requests_tab',
        defaultMessage: 'Tab enabling display of change requests (read only)',
    },
    mobile_org_unit_registry_tooltip: {
        id: 'iaso.projets.featureflag.tooltip.mobile_org_unit_registry',
        defaultMessage:
            'Tab enabling to propose changes to org units and their reference form(s)',
    },
    project_featureFlags: {
        defaultMessage: 'Project feature flags',
        id: 'iaso.label.project.featureFlags',
    },
    close: {
        defaultMessage: 'Close',
        id: 'iaso.label.close',
    },
    qrCodeError: {
        defaultMessage: "Can't load project QR code",
        id: 'iaso.label.project.qrCodeError',
    },
    qrCodeTitle: {
        defaultMessage:
            'This is the QR code to scan from the mobile application for this Project. Click on the sharing button to copy and paste it',
        id: 'iaso.label.project.qrCodeTitle',
    },
    copyToClipboard: {
        defaultMessage: 'Copy to clipboard',
        id: 'iaso.label.copyToClipboard',
    },
});

export default MESSAGES;
