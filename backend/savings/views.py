
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

from django.db import connection, transaction
from django.db.models import Sum

from decimal import Decimal

from .permissions import ChairForWriteMemberRead

from .models import (
    Group,
    Member,
    Saving,
    Loan,
    LoanRepayment,
)

from .serializers import (
    GroupSerializer,
    MemberSerializer,
    SavingSerializer,
    LoanSerializer,
    LoanRepaymentSerializer,
)


# =====================================================
# GROUP API
# =====================================================

@api_view(["GET", "POST", "PATCH", "DELETE"])
@permission_classes([ChairForWriteMemberRead])
def group_list(request):

    # GET: Retrieve all savings groups
    if request.method == "GET":
        groups = Group.objects.all().order_by("id")
        serializer = GroupSerializer(groups, many=True)
        return Response(serializer.data)

    # POST: Create a new savings group
    elif request.method == "POST":
        serializer = GroupSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    # PATCH: Update an existing savings group
    elif request.method == "PATCH":
        group_id = request.data.get("id")

        if not group_id:
            return Response(
                {"error": "Group ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            group = Group.objects.get(id=group_id)
        except Group.DoesNotExist:
            return Response(
                {"error": "Group not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = GroupSerializer(
            group,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    # DELETE: Delete an empty savings group only
    elif request.method == "DELETE":
        group_id = request.data.get("id")

        if not group_id:
            return Response(
                {"error": "Group ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            group = Group.objects.get(id=group_id)
        except Group.DoesNotExist:
            return Response(
                {"error": "Group not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Protect members and their financial records
        if Member.objects.filter(group=group).exists():
            return Response(
                {
                    "error": (
                        "This group cannot be deleted because "
                        "it still has members. Remove or transfer "
                        "its members first."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        group.delete()

        return Response(
            {"message": "Group deleted successfully."},
            status=status.HTTP_200_OK
        )


# =====================================================
# MEMBER API
# =====================================================

@api_view(["GET", "POST", "PATCH", "DELETE"])
@permission_classes([ChairForWriteMemberRead])
def member_list(request):

    # GET: Retrieve all members
    if request.method == "GET":
        members = Member.objects.select_related(
            "group"
        ).all().order_by("id")

        serializer = MemberSerializer(members, many=True)
        return Response(serializer.data)

    # POST: Register a new member
    elif request.method == "POST":
        serializer = MemberSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    # PATCH: Update an existing member
    elif request.method == "PATCH":
        member_id = request.data.get("id")

        if not member_id:
            return Response(
                {"error": "Member ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            member = Member.objects.get(id=member_id)
        except Member.DoesNotExist:
            return Response(
                {"error": "Member not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = MemberSerializer(
            member,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    # DELETE: Delete an existing member
    elif request.method == "DELETE":
        member_id = request.data.get("id")

        if not member_id:
            return Response(
                {"error": "Member ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            member = Member.objects.get(id=member_id)
        except Member.DoesNotExist:
            return Response(
                {"error": "Member not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        member.delete()

        return Response(
            {"message": "Member deleted successfully."},
            status=status.HTTP_200_OK
        )


# =====================================================
# SAVINGS API
# =====================================================

@api_view(["GET", "POST", "PATCH", "DELETE"])
@permission_classes([ChairForWriteMemberRead])
def saving_list(request):

    # GET: Retrieve all savings
    if request.method == "GET":
        savings = Saving.objects.select_related(
            "member"
        ).all().order_by("id")

        serializer = SavingSerializer(savings, many=True)
        return Response(serializer.data)

    # POST: Record new savings
    elif request.method == "POST":
        serializer = SavingSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    # PATCH: Update an existing saving
    elif request.method == "PATCH":
        saving_id = request.data.get("id")

        if not saving_id:
            return Response(
                {"error": "Saving ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            saving = Saving.objects.get(id=saving_id)
        except Saving.DoesNotExist:
            return Response(
                {"error": "Saving not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = SavingSerializer(
            saving,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    # DELETE: Delete an existing saving
    elif request.method == "DELETE":
        saving_id = request.data.get("id")

        if not saving_id:
            return Response(
                {"error": "Saving ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            saving = Saving.objects.get(id=saving_id)
        except Saving.DoesNotExist:
            return Response(
                {"error": "Saving not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        saving.delete()

        return Response(
            {"message": "Saving deleted successfully."},
            status=status.HTTP_200_OK
        )


# =====================================================
# LOAN API
# =====================================================

@api_view(["GET", "POST", "PATCH", "DELETE"])
@permission_classes([ChairForWriteMemberRead])
def loan_list(request):

    # GET: Retrieve all loans
    if request.method == "GET":
        loans = Loan.objects.all().order_by("id")
        serializer = LoanSerializer(loans, many=True)
        return Response(serializer.data)

    # POST: Create a new loan
    elif request.method == "POST":
        serializer = LoanSerializer(data=request.data)

        if serializer.is_valid():
            member = serializer.validated_data["member"]
            amount = serializer.validated_data["amount"]

            if amount <= 0:
                return Response(
                    {"error": "Loan amount must be greater than zero."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            total_savings = Saving.objects.filter(
                member=member
            ).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

            maximum_loan = total_savings * Decimal("3")

            if amount > maximum_loan:
                return Response(
                    {
                        "error": "Loan exceeds the allowed limit.",
                        "maximum_loan": str(maximum_loan)
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            interest = amount * Decimal("0.05")
            total_balance = amount + interest

            serializer.save(balance=total_balance)

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    # PATCH: Update an existing loan
    elif request.method == "PATCH":
        loan_id = request.data.get("id")

        if not loan_id:
            return Response(
                {"error": "Loan ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            loan = Loan.objects.get(id=loan_id)
        except Loan.DoesNotExist:
            return Response(
                {"error": "Loan not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = LoanSerializer(
            loan,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            member = serializer.validated_data.get(
                "member", loan.member
            )

            amount = serializer.validated_data.get(
                "amount", loan.amount
            )

            if amount <= 0:
                return Response(
                    {"error": "Loan amount must be greater than zero."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            total_savings = Saving.objects.filter(
                member=member
            ).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

            maximum_loan = total_savings * Decimal("3")

            if amount > maximum_loan:
                return Response(
                    {
                        "error": "Loan exceeds the allowed limit.",
                        "maximum_loan": str(maximum_loan)
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            interest = amount * Decimal("0.05")
            total_balance = amount + interest

            serializer.save(balance=total_balance)

            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    # DELETE: Delete an existing loan
    elif request.method == "DELETE":
        loan_id = request.data.get("id")

        if not loan_id:
            return Response(
                {"error": "Loan ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            loan = Loan.objects.get(id=loan_id)
        except Loan.DoesNotExist:
            return Response(
                {"error": "Loan not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        loan.delete()

        return Response(
            {"message": "Loan deleted successfully."},
            status=status.HTTP_200_OK
        )


# =====================================================
# GROUP SAVINGS ANALYTICS
# =====================================================

@api_view(["GET"])
@permission_classes([ChairForWriteMemberRead])
def group_savings_analytics(request):

    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT group_id, group_name, total_savings
            FROM public.group_savings_balances
            ORDER BY group_id;
        """)

        rows = cursor.fetchall()

    results = [
        {
            "group_id": row[0],
            "group_name": row[1],
            "total_savings": str(row[2])
        }
        for row in rows
    ]

    return Response(results, status=status.HTTP_200_OK)


# =====================================================
# LOAN REPAYMENT API
# =====================================================

@api_view(["GET", "POST"])
@permission_classes([ChairForWriteMemberRead])
def loan_repayment_list(request):

    # GET: Retrieve all repayment records
    if request.method == "GET":
        repayments = LoanRepayment.objects.all().order_by(
            "-payment_date"
        )

        serializer = LoanRepaymentSerializer(
            repayments,
            many=True
        )

        return Response(serializer.data, status=status.HTTP_200_OK)

    # POST: Record a loan repayment
    elif request.method == "POST":
        serializer = LoanRepaymentSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        amount = serializer.validated_data["amount"]
        requested_loan = serializer.validated_data["loan"]

        if amount <= 0:
            return Response(
                {"error": "Repayment amount must be greater than zero."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():

                # Lock the loan while processing this repayment
                loan = Loan.objects.select_for_update().get(
                    id=requested_loan.id
                )

                if amount > loan.balance:
                    return Response(
                        {
                            "error": (
                                "Repayment exceeds the outstanding "
                                "loan balance."
                            ),
                            "outstanding_balance": str(loan.balance)
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Save repayment history
                repayment = serializer.save(loan=loan)

                # Reduce outstanding loan balance
                loan.balance -= amount
                loan.save(update_fields=["balance"])

                return Response(
                    {
                        "message": "Repayment recorded successfully.",
                        "repayment": LoanRepaymentSerializer(
                            repayment
                        ).data,
                        "remaining_balance": str(loan.balance)
                    },
                    status=status.HTTP_201_CREATED
                )

        except Loan.DoesNotExist:
            return Response(
                {"error": "Loan not found."},
                status=status.HTTP_404_NOT_FOUND
            )
