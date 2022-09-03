from django.urls import include, path

# from graphene_django.views import GraphQLView

# from .admin_site.site import create_admin_site

# admin_site = create_admin_site('DMTP', [
#     'dmtp.web.admin',
# ])

urlpatterns = [
    # path('admin/', admin_site.urls),
    path('', include('dmtp.web.urls')),
    # re_path(r'^graphql$', GraphQLView.as_view(graphiql=True)),
]
