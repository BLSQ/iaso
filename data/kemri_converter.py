import csv

with open("kemri_for_match.csv") as csvfile:
    spamreader = csv.reader(csvfile, delimiter=";")
    buffer = list(csvfile)

    provinces = set()
    titles = buffer[0].split(";")
    del buffer[0]

    indexes_dict = {value: index for (index, value) in enumerate(titles)}

    province_index = indexes_dict["province_sjoin_kemri"]
    zone_index = indexes_dict["zone"]
    area_index = indexes_dict["fosa_name"]
    kemri_id_index = indexes_dict["kemri_id"]
    fosa_name_index = indexes_dict["fosa_name"]
    point_index = indexes_dict["geometry"]
    zones_dict = dict()
    areas_dict = dict()
    for line in buffer:
        l = line.split(";")
        province = l[province_index]
        zone = l[zone_index]
        area = l[area_index]
        provinces.add(province)
        zones_dict[zone] = province

    print(provinces)
    print(zones_dict)
    print(areas_dict)
    # columns to create
    # ref	name	parent_ref	aliases	org_unit_type	source	latitude	longitude	altitude
    with open("kemri_iaso_import.csv", "w", newline="") as f:
        writer = csv.writer(f)
        index = 0
        province_ids = dict()
        zone_ids = dict()
        for province in provinces:
            writer.writerow(
                (index, province, None, "", "province", "kemri", None, None, None, None)
            )
            province_ids[province] = index
            index += 1
        for zone in zones_dict.keys():
            writer.writerow(
                (
                    index,
                    zone,
                    province_ids[zones_dict[zone]],
                    "",
                    "zone",
                    "kemri",
                    None,
                    None,
                    None,
                    None,
                )
            )
            zone_ids[zone] = index
            index += 1

        for line in buffer:
            line = line.split(";")
            kemri_id = line[kemri_id_index]
            fosa_name = line[fosa_name_index]
            point = line[point_index]
            print(point_index, line)
            print("point", point)
            point = point[7:-1]
            print(point)
            latitude, longitude = point.split(" ")
            print(latitude, longitude)
            writer.writerow(
                (
                    kemri_id,
                    fosa_name,
                    zone_ids[line[zone_index]],
                    "",
                    "fosa",
                    "kemri",
                    latitude,
                    longitude,
                    0,
                )
            )
