
from django.db import models


class Group(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=150)
    created_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "groups"

    def __str__(self):
        return self.name


class Member(models.Model):
    id = models.BigAutoField(primary_key=True)
    group = models.ForeignKey(
        Group,
        on_delete=models.DO_NOTHING,
        db_column="group_id"
    )
    name = models.CharField(max_length=150)
    created_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "members"

    def __str__(self):
        return self.name


class Saving(models.Model):
    id = models.BigAutoField(primary_key=True)
    member = models.ForeignKey(
        Member,
        on_delete=models.DO_NOTHING,
        db_column="member_id"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    week = models.DateField()
    created_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "savings"

    def __str__(self):
        return f"{self.member.name}: {self.amount}"


class Loan(models.Model):
    id = models.BigAutoField(primary_key=True)
    member = models.ForeignKey(
        Member,
        on_delete=models.DO_NOTHING,
        db_column="member_id"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    balance = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "loans"

    def __str__(self):
        return f"{self.member.name}: {self.amount}"
class LoanRepayment(models.Model):
    loan = models.ForeignKey(
        Loan,
        on_delete=models.DO_NOTHING,
        db_column="loan_id",
        related_name="repayments"
    )

    amount = models.DecimalField(max_digits=12, decimal_places=2)

    payment_date = models.DateField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = "loan_repayments"

    def __str__(self):
        return f"Repayment {self.amount} for Loan {self.loan_id}"

class Profile(models.Model):
    id = models.UUIDField(primary_key=True)
    full_name = models.TextField()
    role = models.CharField(max_length=20)
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "profiles"

    def __str__(self):
        return f"{self.full_name} ({self.role})"
