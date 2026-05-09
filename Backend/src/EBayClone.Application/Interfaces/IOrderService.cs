using EBayClone.Application.Common;
using EBayClone.Application.DTOs.Orders;

namespace EBayClone.Application.Interfaces;

public interface IOrderService
{
    Task<PagedResult<OrderResponse>> GetOrdersAsync(Guid buyerId, PagedQuery query, CancellationToken ct = default);
    Task<OrderResponse> GetByIdAsync(Guid id, Guid buyerId, CancellationToken ct = default);
    Task<OrderResponse> CheckoutAsync(Guid buyerId, CheckoutRequest request, CancellationToken ct = default);
    Task CancelAsync(Guid id, Guid buyerId, CancellationToken ct = default);
}