from hat.participants.models import HatParticipant
import pandas


def load(df):
    # remove rows with existing ids from the data
    ids = list(df['document_id'])
    existing_ids = HatParticipant.objects \
                                 .filter(document_id__in=ids) \
                                 .values_list('document_id', flat=True)
    df = df[~df['document_id'].isin(existing_ids)]

    if len(df) == 0:
        return df

    # replace NaN with None to be compatible with DB null fields
    df = df.where(pandas.notnull(df), None)

    for col, row in df.iterrows():
        HatParticipant(**dict(row)).save()
    return df
