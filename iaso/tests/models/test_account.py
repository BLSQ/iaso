from django.db import IntegrityError

from iaso.models import Account
from iaso.test import TestCase


class AccountModelTestCase(TestCase):
    def test_name_unique(self):
        """No duplicates are allowed in account names"""
        Account.objects.create(name="a")
        with self.assertRaises(IntegrityError):
            Account.objects.create(name="a")

    def test_short_sanitized_name(self):
        short_name = Account.objects.create(name="abc")
        self.assertEqual(short_name.short_sanitized_name, "abc")

        long_name = Account.objects.create(name="abcdefghijklmnopqrstuvwxyz0123456789")
        self.assertEqual(long_name.short_sanitized_name, "abcdefghijklmnopqrstuvwxyz0123")  # only 30 chars

        name_with_special_chars = Account.objects.create(name="a!@#$%^&*()_+")
        self.assertEqual(name_with_special_chars.short_sanitized_name, "a")

        name_with_spaces = Account.objects.create(name="a  b  c  d e f g  h i j k l m   n o p q r s   t u v w   x y z")
        # trailing _ is removed (30th char), and spaces are replaced with underscores
        self.assertEqual(name_with_spaces.short_sanitized_name, "a_b_c_d_e_f_g_h_i_j_k_l_m_n_o")

        invalid_name = Account.objects.create(name="$$$%%^^&&**")
        self.assertEqual(invalid_name.short_sanitized_name, "invalid_name")
