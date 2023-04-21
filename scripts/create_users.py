from iaso.models import *
from iaso.models.microplanning import *
from django.contrib.auth.models import User
from django.contrib.gis.geos import Point


def get_location(grand_child, child):
    val = None
    if grand_child.geom and grand_child.geom.centroid:
        val = grand_child.geom.centroid
    elif grand_child.location:
        val = grand_child.location
    elif child.geom and child.geom.centroid:
        val = child.geom.centroid
    elif child.location:
        val = child.location

    if val is not None:
        return Point(val.x, val.y, 0)
    else:
        return None


account = Account.objects.get(id=22)
print("Account: " + account.name)


orgunit_master = OrgUnit.objects.get(id=1074010)  # ll Province Lualaba
print("Master OrgUnit: " + orgunit_master.name)

# account -> source_version <- orgunit
children = OrgUnit.objects.filter(parent=orgunit_master)

parent_team = Team.objects.get(id=78)  # Equipe Principale Lualaba, I have put Challeux as manager
print("Parent Team: " + parent_team.name)

the_project = Project.objects.get(id=41)  # Canevas Annuel
print("Project: " + the_project.name)

the_manager = User.objects.get(username="CHalleux")  # Claire ??
print("Manager: " + the_manager.username)


# create one team per Zone
for child in children:
    print(child.name)
    team, created = Team.objects.get_or_create(
        name=child.name,
        description="Team created for the Zone {child.name}",
        project=the_project,
        parent=parent_team,
        manager=the_manager,
        type=TeamType.TEAM_OF_USERS,
    )

    print(f"Created team {child.name} with parent {parent_team.name} manager {the_manager.username}")


profiles = Profile.objects.filter(account=account)

# Province > Zone > Aire
# Team par Zone
# 1 user par Aire

# add each user to the zone team that includes his area
for p in profiles:
    print(f"User {p.user.username}")
    p_ous = p.org_units.all()
    if len(p_ous) == 1:
        p_ou = p_ous[0]
        print(
            f"User {p.user.username} is in {p_ou.id}:{p_ou.name} > {p_ou.parent.id}:{p_ou.parent.name} > {p_ou.parent.parent.id}:{p_ou.parent.parent.name}"
        )

        # print(f"Parent OU {p_ou.parent.id}:{p_ou.parent.name}")
        # print(f"Parent Parent OU {p_ou.parent.parent.id}:{p_ou.parent.parent.name}")
        # print(f"Master OrgUnit: {orgunit_master.id}:{orgunit_master.name}")

        if p_ou.parent.parent == orgunit_master:
            print(f"User {p.user.username} is in {p_ou.name}")
            team = Team.objects.get(name=p_ou.parent.name)
            team.users.add(p.user)
            team.save()
            print("Added to team " + p_ou.parent.name)
        else:
            print(f"!! User {p.user.username} is not descendant of  {orgunit_master.name}")

    elif len(p_ous) == 0:
        print(f"!! User {p.user.username} has no area")
    else:
        print(f"!! User {p.user.username} has more than one area")

    print("---")


the_planning = Planning.objects.get(id=48)  # Lualaba

point_of_interest_type = OrgUnitType.objects.get(projects__account=account, short_name="POI")
aire_de_sante = OrgUnitType.objects.get(projects__account=account, short_name="AS")

for child in children:

    grand_children = OrgUnit.objects.filter(parent=child, org_unit_type=aire_de_sante)

    # for all the areas in the zone "child"
    for g in grand_children.all():

        print(f"OrgUnit {g.name}")

        # create 30 (ask claire) POI per area (you will probably need to set a point to the poi in the center of the area)

        try:
            corresp_profile = profiles.get(org_units=g, account=account)
        except:
            corresp_profile = None

        try:
            corresp_team = Team.objects.get(name=child.name)
        except:
            corresp_team = None

        if corresp_profile is None or corresp_team is None:
            print(f"!! Didnt find a profile or a team for {g.name}")
            print(f"Profile {corresp_profile}")
            print(f"Team {corresp_team}")
        else:

            for i in range(0, 30):
                # create 30 POI per area

                print("Location : " + str(get_location(g, child)))
                print("Type of location : " + str(type(get_location(g, child))))

                ou, created = OrgUnit.objects.get_or_create(
                    name=f"POI_{i:02d}",  # format avec 0 devant
                    parent=g,
                    org_unit_type=point_of_interest_type,
                    version=account.default_version,
                    defaults={"location": get_location(g, child)},
                )

                print("Created? " + str(created))

                print(
                    f"Created POI_{i:02d} with parent {g.name} type {point_of_interest_type.short_name} location {get_location(g, child)}"
                )

                # create assignments in the existing plannong of each POIs  to people in the current area

                correct_assignment = Assignment.objects.get_or_create(
                    planning=the_planning, org_unit=ou, user=corresp_profile.user, team=corresp_team
                )

                print(
                    f"Created assignment for {corresp_profile.user.username} in team {corresp_team.name} for POI_{i:02d}"
                )

# for deleting the wrong assignments created
for child in children:

    grand_children = OrgUnit.objects.filter(parent=child, org_unit_type=aire_de_sante)

    # for all the areas in the zone "child"
    for g in grand_children.all():

        print(f"OrgUnit {g.name}")

        # create 30 (ask claire) POI per area (you will probably need to set a point to the poi in the center of the area)

        try:
            corresp_profile = profiles.get(org_units=g, account=account)
        except:
            corresp_profile = None

        try:
            corresp_team = Team.objects.get(name=child.name)
        except:
            corresp_team = None

        if corresp_profile is None or corresp_team is None:
            print(f"!! Didnt find a profile or a team for {g.name}")
            print(f"Profile {corresp_profile}")
            print(f"Team {corresp_team}")
        else:

            assignment_orig = Assignment.objects.get(
                planning=the_planning, org_unit=g, user=corresp_profile.user, team=corresp_team
            )

            print(f"Found assignment {assignment_orig}")

            res = assignment_orig.delete()

            print(f"Deleted assignment {res}")
