
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from django.db import connection, transaction
from django.db.models import Sum

from decimal import Decimal
from .permissions import ChairForWriteMemberRead, ChairOnly

from .models import (
    Group,
    Member,
    Saving,
    Loan,
    LoanRepayment,
    Profile,
)

from .serializers import (
    GroupSerializer,
    MemberSerializer,
    SavingSerializer,
    LoanSerializer,
    LoanRepaymentSerializer,
)


# =====================================================
# PUBLIC GROUP LIST API
# =====================================================

@api_view(["GET"])
@permission_classes([AllowAny])
def public_group_list(request):
    groups = Group.objects.all().order_by("id")
    serializer = GroupSerializer(groups, many=True)
    return Response(serializer.data)


# =====================================================
# GROUP API
# =====================================================

@api_view(["GET", "POST", "PATCH", "DELETE"])
@permission_classes([ChairForWriteMemberRead])
def group_list(request):

    # GET: Retrieve groups based on user role
    if request.method == "GET":

        if request.user.role == "chair":
            groups = Group.objects.all().order_by("id")

        elif request.user.role == "member":
            if not request.user.member_id:
                return Response(
                    {"error": "Your account is not linked to a member."},
                    status=status.HTTP_403_FORBIDDEN
                )

            group_id = Member.objects.filter(
                id=request.user.member_id
            ).values_list("group_id", flat=True).first()

            if group_id is None:
                return Response(
                    {"error": "Member record not found."},
                    status=status.HTTP_403_FORBIDDEN
                )

            groups = Group.objects.filter(
                id=group_id
            ).order_by("id")

        else:
            return Response(
                {"error": "Access denied."},
                status=status.HTTP_403_FORBIDDEN
            )

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

        # GET: Retrieve members based on user role
    if request.method == "GET":

        if request.user.role == "chair":
            members = Member.objects.select_related(
                "group"
            ).all().order_by("id")

        elif request.user.role == "member":
            if not request.user.member_id:
                return Response(
                    {"error": "Your account is not linked to a member."},
                    status=status.HTTP_403_FORBIDDEN
                )

            members = Member.objects.select_related(
                "group"
            ).filter(
                id=request.user.member_id
            ).order_by("id")

        else:
            return Response(
                {"error": "Access denied."},
                status=status.HTTP_403_FORBIDDEN
            )

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

    # GET: Retrieve savings based on user role
    if request.method == "GET":

        if request.user.role == "chair":
            savings = Saving.objects.select_related(
                "member"
            ).all().order_by("id")

        elif request.user.role == "member":
            if not request.user.member_id:
                return Response(
                    {"error": "Your account is not linked to a member."},
                    status=status.HTTP_403_FORBIDDEN
                )

            savings = Saving.objects.select_related(
                "member"
            ).filter(
                member_id=request.user.member_id
            ).order_by("id")

        else:
            return Response(
                {"error": "Access denied."},
                status=status.HTTP_403_FORBIDDEN
            )

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

    # GET: Retrieve loans based on user role
    if request.method == "GET":

        if request.user.role == "chair":
            loans = Loan.objects.all().order_by("id")

        elif request.user.role == "member":
            if not request.user.member_id:
                return Response(
                    {"error": "Your account is not linked to a member."},
                    status=status.HTTP_403_FORBIDDEN
                )

            loans = Loan.objects.filter(
                member_id=request.user.member_id
            ).order_by("id")

        else:
            return Response(
                {"error": "Access denied."},
                status=status.HTTP_403_FORBIDDEN
            )

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

    if request.user.role == "chair":
        query = """
            SELECT group_id, group_name, total_savings
            FROM public.group_savings_balances
            ORDER BY group_id;
        """
        params = []

    elif request.user.role == "member":
        if not request.user.member_id:
            return Response(
                {"error": "Your account is not linked to a member."},
                status=status.HTTP_403_FORBIDDEN
            )

        group_id = Member.objects.filter(
            id=request.user.member_id
        ).values_list("group_id", flat=True).first()

        if group_id is None:
            return Response(
                {"error": "Member record not found."},
                status=status.HTTP_403_FORBIDDEN
            )

        query = """
            SELECT group_id, group_name, total_savings
            FROM public.group_savings_balances
            WHERE group_id = %s
            ORDER BY group_id;
        """
        params = [group_id]

    else:
        return Response(
            {"error": "Access denied."},
            status=status.HTTP_403_FORBIDDEN
        )

    with connection.cursor() as cursor:
        cursor.execute(query, params)
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


# LOAN REPAYMENT API
# =====================================================

@api_view(["GET", "POST"])
@permission_classes([ChairForWriteMemberRead])
def loan_repayment_list(request):

    # GET: Retrieve repayments based on user role
    if request.method == "GET":

        if request.user.role == "chair":
            repayments = LoanRepayment.objects.select_related(
                "loan", "loan__member"
            ).all().order_by("-payment_date")

        elif request.user.role == "member":
            if not request.user.member_id:
                return Response(
                    {"error": "Your account is not linked to a member."},
                    status=status.HTTP_403_FORBIDDEN
                )

            repayments = LoanRepayment.objects.select_related(
                "loan", "loan__member"
            ).filter(
                loan__member_id=request.user.member_id
            ).order_by("-payment_date")

        else:
            return Response(
                {"error": "Access denied."},
                status=status.HTTP_403_FORBIDDEN
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
# =====================================================
# =====================================================
# APPROVE MEMBER REGISTRATION API
# =====================================================

@api_view(["POST"])
@permission_classes([ChairOnly])
def link_member_account(request):
    profile_id = request.data.get("profile_id")

    if not profile_id:
        return Response(
            {"error": "Registration profile ID is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        with transaction.atomic():
            profile = Profile.objects.select_for_update().get(
                id=profile_id,
                role="member"
            )

            if profile.member_id:
                return Response(
                    {"error": "This account is already linked to a member."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not profile.requested_group_id:
                return Response(
                    {"error": "This registration has no selected savings group."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            group = Group.objects.select_for_update().get(
                id=profile.requested_group_id
            )

            # Create a new member; do not reuse or modify existing members.
            member = Member.objects.create(
                group=group,
                name=profile.full_name
            )

            profile.member = member
            profile.save(update_fields=["member"])

            return Response(
                {
                    "message": "Registration approved and new member created.",
                    "member_id": member.id,
                    "member_name": member.name,
                    "group_id": group.id,
                    "group_name": group.name,
                    "email": profile.email
                },
                status=status.HTTP_200_OK
            )

    except Profile.DoesNotExist:
        return Response(
            {"error": "Pending registration not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    except Group.DoesNotExist:
        return Response(
            {"error": "The selected savings group no longer exists."},
            status=status.HTTP_404_NOT_FOUND
        )


# =====================================================
# PENDING MEMBER REGISTRATIONS API
# =====================================================

@api_view(["GET"])
@permission_classes([ChairOnly])
def pending_member_registrations(request):
    pending_accounts = Profile.objects.filter(
        role="member",
        member__isnull=True
    ).select_related("requested_group").order_by("-created_at")

    data = [
        {
            "id": str(profile.id),
            "full_name": profile.full_name,
            "email": profile.email,
            "requested_group_id": profile.requested_group_id,
            "requested_group_name": (
                profile.requested_group.name
                if profile.requested_group_id else None
            ),
            "created_at": profile.created_at
        }
        for profile in pending_accounts
    ]

    return Response(
        {
            "count": len(data),
            "pending_registrations": data
        },
        status=status.HTTP_200_OK
    )
