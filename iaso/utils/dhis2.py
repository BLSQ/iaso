import random


def generate_id_for_dhis_2():
    letters = "abcdefghijklmnopqrstuvwxyz"
    letters = letters + letters.upper()
    all_chars = "0123456789" + letters
    first_letter = random.choice(letters)
    other_letters = random.choices(all_chars, k=10)
    return first_letter + "".join(other_letters)
