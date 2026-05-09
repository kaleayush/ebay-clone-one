namespace EBayClone.Application.DTOs.Listings;

public record ListingResponse(
    Guid Id,
    string Title,
    string Description,
    int ListingType,
    decimal Price,
    decimal? StartingBid,
    decimal? ReservePrice,
    decimal? BuyItNowPrice,
    DateTime? AuctionStartAt,
    DateTime? AuctionEndAt,
    int Quantity,
    bool FreeShipping,
    int Status,
    bool IsDeleted,
    string? PrimaryImageUrl,
    Guid SellerId,
    string SellerName,
    Guid? CategoryId,
    string? CategoryName,
    IReadOnlyCollection<ListingAttributeValueResponse> AttributeValues,
    IReadOnlyCollection<ListingImageResponse> Images,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record ListingAttributeValueResponse(
    Guid CategoryAttributeId,
    string AttributeName,
    string DisplayName,
    int DataType,
    string Value,
    string? DisplayValue
);

public record ListingImageResponse(
    Guid Id,
    string Url,
    string? AltText,
    int SortOrder
);
