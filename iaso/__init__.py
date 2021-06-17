# Used by django-contrib-comment for customizing model
def get_model():
    from iaso.models.comment import CommentIaso

    return CommentIaso
