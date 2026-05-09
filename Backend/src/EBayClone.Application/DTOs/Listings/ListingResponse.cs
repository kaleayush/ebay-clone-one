namespace EBayClone.Application.DTOs.Listings;

public record ListingResponse(
    Guid Id,
    string Title,
    string Description,
    decimal Price,
    int Quantity,
    bool FreeShipping,
    int Status,
    string? PrimaryImageUrl,
    Guid SellerId,
    string SellerName,
    Guid? CategoryId,
    string? CategoryName,
    DateTime CreatedAt,
    DateTime UpdatedAt
);