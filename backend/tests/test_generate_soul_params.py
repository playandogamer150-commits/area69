from app.api.v1.endpoints.generate import aspect_ratio_dimensions


def test_non_soul_dimension_helper_still_maps_requested_shape() -> None:
    assert aspect_ratio_dimensions("4:3", "1080p") == (1536, 1152)
