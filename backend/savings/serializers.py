
from rest_framework import serializers
from .models import Group, Member
from .models import Group, Member, Saving, Loan, LoanRepayment


class GroupSerializer(serializers.ModelSerializer):

    class Meta:
        model = Group
        fields = ["id", "name", "created_at"]
        read_only_fields = ["id", "created_at"]


class MemberSerializer(serializers.ModelSerializer):

    class Meta:
        model = Member
        fields = ["id", "group", "name", "created_at"]
        read_only_fields = ["id", "created_at"]
class SavingSerializer(serializers.ModelSerializer):

    class Meta:
        model = Saving
        fields = ["id", "member", "amount", "week", "created_at"]
        read_only_fields = ["id", "created_at"]
class LoanSerializer(serializers.ModelSerializer):

    class Meta:
        model = Loan
        fields = ["id", "member", "amount", "balance"]
        read_only_fields = ["id", "balance"]

class LoanRepaymentSerializer(serializers.ModelSerializer):

    class Meta:
        model = LoanRepayment
        fields = [
            "id",
            "loan",
            "amount",
            "payment_date",
            "created_at"
        ]

        read_only_fields = ["id", "created_at"]