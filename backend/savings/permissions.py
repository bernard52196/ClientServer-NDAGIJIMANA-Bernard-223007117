from rest_framework.permissions import BasePermission, SAFE_METHODS


class ChairForWriteMemberRead(BasePermission):
    """
    Chairs can read and modify records.
    Members can only read records.
    """

    message = "Only the chair can create, edit, or delete records."

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return user.role in ["chair", "member"]

        return user.role == "chair"
class ChairOnly(BasePermission):
    message = "Only the chair can link member accounts."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.role == "chair"
        )
