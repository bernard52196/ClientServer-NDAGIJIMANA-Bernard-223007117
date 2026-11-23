
from django.test import SimpleTestCase
from rest_framework.test import APIClient
from unittest.mock import patch

from .models import Group, Member, Saving, Loan


class SavingsAPITests(SimpleTestCase):

    def setUp(self):
        self.client = APIClient()

    def test_get_groups(self):
        with patch.object(Group.objects, "all") as mock_all:
            mock_all.return_value.order_by.return_value = []
            response = self.client.get("/api/groups/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_get_members(self):
        with patch.object(Member.objects, "select_related") as mock_select:
            mock_select.return_value.all.return_value.order_by.return_value = []
            response = self.client.get("/api/members/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_get_savings(self):
        with patch.object(Saving.objects, "select_related") as mock_select:
            mock_select.return_value.all.return_value.order_by.return_value = []
            response = self.client.get("/api/savings/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_get_loans(self):
        with patch.object(Loan.objects, "all") as mock_all:
            mock_all.return_value.order_by.return_value = []
            response = self.client.get("/api/loans/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_group_savings_analytics(self):
        with patch("savings.views.connection") as mock_connection:
            mock_connection.cursor.return_value.__enter__.return_value.fetchall.return_value = []
            response = self.client.get("/api/analytics/group-savings/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])
