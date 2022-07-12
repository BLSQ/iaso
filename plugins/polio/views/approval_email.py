from django.shortcuts import render


def test_email_render(request):
    return render(
        request,
        "validation_email.html",
        {
            "validation_link": "https://www.lesoir.be",
            "rejection_link": "https://www.theguardian.com",
            "campaign": "Test campaign",
            "LANGUAGE_CODE": "en",
            "author_first_name": "Johnny",
            "author_last_name": "Rotten",
            "comment": "I am Johnny Rotten and I approve this budget",
            "team": "Sex Pistols",
            "sender": "iaso-staging.bluesquare.org",
            "event_type": "submission",
        },
    )
    
def test_budget_approval_render(request):
    return render(request,"budget_approved_email.html",{
        "campaign": "Test campaign",
        "LANGUAGE_CODE": "en",
        "sender": "iaso-staging.bluesquare.org",
        "link": "https://media.giphy.com/media/g7GKcSzwQfugw/giphy.gif"
    })
def event_creation_render(request):
    return render(request,"event_created_email.html",{
        "campaign": "Test campaign",
        "LANGUAGE_CODE": "en",
        "first_name": "Johnny",
        "last_name": "Rotten",
        "comment": "I am Johnny Rotten and I approve this budget",
        "sender": "iaso-staging.bluesquare.org",
        "link": "https://media.giphy.com/media/g7GKcSzwQfugw/giphy.gif",
        "event_type": "submission",
    })
