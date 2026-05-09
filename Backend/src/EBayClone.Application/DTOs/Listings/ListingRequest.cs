using EBayClone.Domain.Enums;

namespace EBayClone.Application.DTOs.Listings;

public record CreateListingRequest(
    string Title,
    string Description,
    decimal Price,
    int Quantity,
    bool FreeShipping = false,
    Guid? CategoryId = null,
    ListingStatus Status = ListingStatus.Draft
);

public record UpdateListingRequest(
    string Title,
    string Description,
    decimal Price,
    int Quantity,
    bool FreeShipping = false,
    Guid? CategoryId = null,
    ListingStatus? Status = null
);

public record ListingQuery(
    int Page = 1,
    int PageSize = 24,
    string? Search = null,
    string? Category = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    ListingStatus? Status = null,
    Guid? SellerId = null,
    string SortBy = "createdAt",
    string SortDirection = "desc"
);