from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('article/<slug:page>', views.articles, name='article'),
]
