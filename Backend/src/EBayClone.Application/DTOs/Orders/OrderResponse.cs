namespace EBayClone.Application.DTOs.Orders;

public record OrderResponse(
    Guid Id,
    string OrderNumber,
    decimal TotalAmount,
    int Status,
    string? ShippingAddress,
    Guid BuyerId,
    string BuyerName,
    IEnumerable<OrderItemResponse> Items,
    int ItemCount,
    DateTime CreatedAt
);

public record OrderItemResponse(
    Guid Id,
    Guid ListingId,
    string ListingTitle,
    int Quantity,
    decimal UnitPrice
);