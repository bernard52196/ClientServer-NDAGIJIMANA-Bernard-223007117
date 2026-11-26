
from django.urls import path
from . import views

urlpatterns = [
    path("groups/", views.group_list, name="group-list"),
    path("members/", views.member_list, name="member-list"),
    path("savings/", views.saving_list, name="saving-list"),
    path("loans/", views.loan_list, name="loan-list"),
    path(
        "loan-repayments/",
        views.loan_repayment_list,
        name="loan-repayments"
    ),
    path(
        "analytics/group-savings/",
        views.group_savings_analytics,
        name="group-savings-analytics"
    ),
   path("link-member-account/", views.link_member_account, name="link-member-account"),
   path(
    "pending-member-registrations/",
    views.pending_member_registrations,
    name="pending-member-registrations"
),
   
]
