from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    """DRF pagination that allows client-controlled page sizes.

    This repo's docs and frontend rely on a `page_size` query param.
    """

    page_size_query_param = "page_size"
    max_page_size = 100
