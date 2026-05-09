namespace EBayClone.Application.DTOs.Orders;

public record CheckoutRequest(
    IEnumerable<CheckoutItem> Items,
    string? ShippingAddress = null,
    string? Notes = null
);

public record CheckoutItem(Guid ListingId, int Quantity);