# How to exclude a featureflag related to a module

## 1. Add a new module for which to exclude its related feature flag

- Go to `/hat/menupermissions/constants.py`
- Add to the dictionnary `FEATUREFLAGES_TO_EXCLUDE` a new item
- The key is the name of the module like `DATA_COLLECTION_FORMS` in capitale letter
- The value is a list of featureflags(code in capitale letter) to be excluded like `["FEATUREFLAG_1","FEATUREFLAG_2"]`
- The whole `FEATUREFLAGES_TO_EXCLUDE` should be like `FEATUREFLAGES_TO_EXCLUDE = { "MODULE_1": ["FEATUREFLAG_1"], "MODULE_2": ["FEATUREFLAG_2", "FEATUREFLAG_3"],}`

## 2. Add a feature flag to an existing module to be excluded

- Go to `/hat/menupermissions/constants.py`
- Check the key corresponding to the module
- Add the featureflag code to the value list of the corresponding module(key)