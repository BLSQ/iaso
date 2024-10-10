Allow keeping a history of modification done on a Model instance.

It is not automatic, model that wish to implement this have to call log_modification manually when changed. Diff are stored in audit.Modification model.