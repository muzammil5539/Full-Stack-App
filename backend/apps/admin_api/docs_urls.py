from django.urls import path

from .docs_views import AdminDocsDetailView, AdminDocsListView


urlpatterns = [
    path('', AdminDocsListView.as_view(), name='docs-list'),
    path('<str:name>/', AdminDocsDetailView.as_view(), name='docs-detail'),
]
