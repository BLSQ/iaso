API_CALLS = [
    {
        "path": "/api/orgunittypes/",
        "filename": "orgunittypes",
    },
    {
        "path": "/api/mobile/groups/",
        "filename": "groups",
    },
    {
        "path": "/api/mobile/forms/",
        "filename": "forms",
        "query_params": {
            "fields":"id,name,form_id,org_unit_types,period_type,single_per_period,periods_before_allowed,periods_after_allowed,latest_form_version,label_keys,possible_fields,predefined_filters,has_attachments,created_at,updated_at,reference_form_of_org_unit_types"
        },
    },
    {
        "path": "/api/formversions/",
        "filename": "formversions",
        "query_params": {
            "fields": "id,version_id,form_id,form_name,full_name,file,mapped,start_period,end_period,mapping_versions,descriptor,created_at,updated_at"
        },
    },
    {
        "path": "/api/mobile/orgunits/",
        "filename": "orgunits",
        "page_size": 25000,
        "query_params": {
          "shapes": 0
        },
    },
    {
        "path": "/api/mobile/orgunits/changes/",
        "required_feature_flag": "MOBILE_ORG_UNIT_REGISTRY",
        "filename": "orgunitchanges",
    },
    {
        "path": "/api/mobile/plannings/",
        "required_feature_flag": "PLANNING",
        "filename": "plannings",
    },
    {
        "path": "/api/mobile/storage/passwords/",
        "required_feature_flag": "ENTITY",
        "filename": "storage-passwords",
    },
    {
        "path": "/api/mobile/storage/blacklisted/",
        "required_feature_flag": "ENTITY",
        "filename": "storage-blacklisted",
    },
    {
        "path": "/api/mobile/entities/",
        "required_feature_flag": "ENTITY",
        "filename": "entities",
    },
    {
        "path": "/api/mobile/entitytypes/",
        "required_feature_flag": "ENTITY",
        "filename": "entitytypes",
    },
    {
        "path": "/api/mobile/reports/",
        "required_feature_flag": "REPORTS",
        "filename": "reports",
    },
    {
        "path": "/api/mobile/workflows/",
        "required_feature_flag": "ENTITY",
        "filename": "workflows",
    },
]
