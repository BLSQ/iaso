TODO list for Active List Plugin
--------------------------------
- bi-directional data exchange with IASO entities ✅
  - Record to xlsforms ✅
    - Registration ✅
    - Suivi ✅
  - submissions to IASO ✅
    - Registration ✅
    - Suivi ✅
- Automate regular data imports ✅

### General Improvements
- Ensure that excel download are in the same format as upload
- Improve the navigation: ensure that urls include the org unit and period
- Check permissions per person based on org units
- Ease navigation from dashboard to "/" 

### Superset Dashboards
- Update superset dashboards with latest model
- Ensure dashboards can be filtered on validated records

### Excel Upload Validation
- Give an easy to understand validation message ✅
- Validate ETS code at record upload (should be matching the org unit) ✅
- Handle correctly status when uploading records via excel (nv, etc .... )
- Think of what to do with records that are created twice (prevent reentry of the exact same record? )
- Test all import examples that we got
- Excel import should update the reference form of entities !!!!
- Ensure that period in excel imports are the same as the one declared in the web ui  ✅

### Data Validation
- validation per region
- Adding indicators on the validation screen
- Send emails on validation issues
