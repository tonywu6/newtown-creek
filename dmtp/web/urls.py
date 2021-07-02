from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('article/<slug:page>', views.articles, name='article'),
    path('404', views.http404, name='http404'),
    path('static/gql.json', views.gql, name='gql'),
]
