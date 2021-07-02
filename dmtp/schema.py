import graphene

import dmtp.web.schema


class Query(dmtp.web.schema.Query, graphene.ObjectType):
    pass


schema = graphene.Schema(query=Query)
