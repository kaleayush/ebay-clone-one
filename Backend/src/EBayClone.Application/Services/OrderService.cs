using EBayClone.Application.Common;
using EBayClone.Application.DTOs.Orders;
using EBayClone.Application.Interfaces;
using EBayClone.Domain.Entities;
using EBayClone.Domain.Enums;
using EBayClone.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EBayClone.Application.Services;

public class OrderService(
    IRepository<Order> orderRepository,
    IRepository<Listing> listingRepository,
    IRepository<User> userRepository,
    ILogger<OrderService> logger) : IOrderService
{
    public async Task<PagedResult<OrderResponse>> GetOrdersAsync(Guid buyerId, PagedQuery query, CancellationToken ct = default)
    {
        var q = orderRepository.Query()
            .Include(o => o.Items)
            .Include(o => o.Buyer)
            .Where(o => o.BuyerId == buyerId)
            .OrderByDescending(o => o.CreatedAt)
            .AsNoTracking();

        var total = await q.CountAsync(ct);
        var items = await q
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(ct);

        return PagedResult<OrderResponse>.Create(
            items.Select(MapToResponse).ToList(),
            total, query.Page, query.PageSize);
    }

    public async Task<OrderResponse> GetByIdAsync(Guid id, Guid buyerId, CancellationToken ct = default)
    {
        var order = await orderRepository.Query()
            .Include(o => o.Items)
            .Include(o => o.Buyer)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == id, ct)
            ?? throw new KeyNotFoundException($"Order {id} not found.");

        if (order.BuyerId != buyerId)
            throw new UnauthorizedAccessException("Access denied.");

        return MapToResponse(order);
    }

    public async Task<OrderResponse> CheckoutAsync(Guid buyerId, CheckoutRequest request, CancellationToken ct = default)
    {
        var buyer = await userRepository.GetByIdAsync(buyerId, ct)
            ?? throw new KeyNotFoundException("Buyer not found.");

        var listingIds = request.Items.Select(i => i.ListingId).ToList();
        var listings = await listingRepository.Query()
            .Where(l => listingIds.Contains(l.Id) && l.Status == ListingStatus.Active)
            .ToListAsync(ct);

        var order = new Order
        {
            OrderNumber = GenerateOrderNumber(),
            BuyerId = buyerId,
            ShippingAddress = request.ShippingAddress,
            Notes = request.Notes,
            Status = OrderStatus.Pending,
        };

        foreach (var item in request.Items)
        {
            var listing = listings.FirstOrDefault(l => l.Id == item.ListingId)
                ?? throw new InvalidOperationException($"Listing {item.ListingId} is not available.");

            if (listing.Quantity < item.Quantity)
                throw new InvalidOperationException($"Insufficient stock for '{listing.Title}'.");

            order.Items.Add(new OrderItem
            {
                ListingId = listing.Id,
                ListingTitle = listing.Title,
                Quantity = item.Quantity,
                UnitPrice = GetFinalPrice(listing),
            });

            listing.Quantity -= item.Quantity;
            if (listing.Quantity == 0)
                listing.Status = ListingStatus.Sold;

            listingRepository.Update(listing);
        }

        order.TotalAmount = order.Items.Sum(i => i.UnitPrice * i.Quantity);

        await orderRepository.AddAsync(order, ct);
        await orderRepository.SaveChangesAsync(ct);

        logger.LogInformation("Order created: {OrderNumber} for buyer {BuyerId}", order.OrderNumber, buyerId);

        order.Buyer = buyer;
        return MapToResponse(order);
    }

    public async Task CancelAsync(Guid id, Guid buyerId, CancellationToken ct = default)
    {
        var order = await orderRepository.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Order {id} not found.");

        if (order.BuyerId != buyerId)
            throw new UnauthorizedAccessException("Access denied.");

        if (order.Status != OrderStatus.Pending)
            throw new InvalidOperationException("Only pending orders can be cancelled.");

        order.Status = OrderStatus.Cancelled;
        order.UpdatedAt = DateTime.UtcNow;
        orderRepository.Update(order);
        await orderRepository.SaveChangesAsync(ct);
    }

    private static string GenerateOrderNumber() =>
        $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}";

    private static decimal GetFinalPrice(Listing listing) =>
        Math.Max(listing.Price - listing.DiscountAmount, 0);

    private static OrderResponse MapToResponse(Order o) => new(
        o.Id, o.OrderNumber, o.TotalAmount, (int)o.Status, o.ShippingAddress,
        o.BuyerId, $"{o.Buyer?.FirstName} {o.Buyer?.LastName}".Trim(),
        o.Items.Select(i => new OrderItemResponse(i.Id, i.ListingId, i.ListingTitle, i.Quantity, i.UnitPrice)),
        o.Items.Count, o.CreatedAt
    );
}
