
import logging
import jwt
from jwt import PyJWKClient

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import Profile


logger = logging.getLogger(__name__)


SUPABASE_URL = "https://nmynhpysmeyxikfuqpml.supabase.co"

JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"

SUPABASE_ISSUER = f"{SUPABASE_URL}/auth/v1"


class SupabaseUser:
    def __init__(self, user_id, email=None, role=None, member_id=None):
        self.id = user_id
        self.pk = user_id
        self.email = email
        self.role = role
        self.member_id = member_id
        self.is_authenticated = True
        self.is_anonymous = False
class SupabaseAuthentication(BaseAuthentication):

    def authenticate(self, request):
        authorization = request.headers.get("Authorization", "")

        if not authorization:
            return None

        parts = authorization.split()

        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise AuthenticationFailed("Invalid authorization header.")

        token = parts[1]

        try:
            signing_key = PyJWKClient(JWKS_URL).get_signing_key_from_jwt(token)

            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256", "RS256"],
                audience="authenticated",
                issuer=SUPABASE_ISSUER,
            )

            user_id = payload.get("sub")

            if not user_id:
                raise AuthenticationFailed("Token does not contain a user ID.")

            try:
                profile = Profile.objects.get(id=user_id)
            except Profile.DoesNotExist:
                raise AuthenticationFailed("User profile not found.")

            if profile.role not in ["chair", "member"]:
                raise AuthenticationFailed("Invalid user role.")

            user = SupabaseUser(
                user_id=user_id,
                email=payload.get('email'),
                role=profile.role,
                member_id=profile.member_id,
            )

            return user, token

        except AuthenticationFailed:
            raise

        except Exception:
            logger.exception("SUPABASE AUTHENTICATION ERROR")

            raise AuthenticationFailed(
                "Invalid token or unable to verify user profile."
            )

    def authenticate_header(self, request):
        return "Bearer"
