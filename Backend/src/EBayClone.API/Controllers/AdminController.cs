using System.Security.Claims;
using EBayClone.Application.Common;
using EBayClone.Application.DTOs.BusinessProfile;
using EBayClone.Application.Interfaces;
using EBayClone.Domain.Entities;
using EBayClone.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EBayClone.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController(
    IRepository<User> userRepository,
    IRepository<Listing> listingRepository,
    IRepository<Order> orderRepository,
    IBusinessProfileService businessProfileService) : ControllerBase
{
    [HttpGet("stats")]
    public async Task<ActionResult<ApiResponse<AdminStatsResponse>>> GetStats(CancellationToken ct)
    {
        var totalUsers = await userRepository.CountAsync(ct: ct);
        var activeListings = await listingRepository.CountAsync(
            l => l.Status == Domain.Enums.ListingStatus.Active, ct);
        var totalOrders = await orderRepository.CountAsync(ct: ct);
        var totalRevenue = await orderRepository.Query()
            .Where(o => o.Status == Domain.Enums.OrderStatus.Delivered)
            .SumAsync(o => o.TotalAmount, ct);

        return Ok(ApiResponse<AdminStatsResponse>.Ok(new AdminStatsResponse(
            totalUsers, activeListings, totalOrders, totalRevenue)));
    }

    [HttpGet("users")]
    public async Task<ActionResult<ApiResponse<PagedResult<AdminUserResponse>>>> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 15,
        [FromQuery] string? search = null, CancellationToken ct = default)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);

        var q = userRepository.Query().IgnoreQueryFilters().AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(u => u.Email.Contains(search) || u.FirstName.Contains(search) || u.LastName.Contains(search));

        var total = await q.CountAsync(ct);
        var items = await q.OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminUserResponse(
                u.Id,
                u.FirstName,
                u.LastName,
                u.Email,
                (int)u.AccountType,
                u.Role.ToString(),
                u.IsEmailVerified,
                u.IsSuspended,
                u.IsDeleted,
                u.CreatedAt))
            .ToListAsync(ct);

        return Ok(ApiResponse<PagedResult<AdminUserResponse>>.Ok(
            PagedResult<AdminUserResponse>.Create(items, total, page, pageSize)));
    }

    [HttpPatch("users/{id:guid}/suspend")]
    public async Task<ActionResult> SuspendUser(Guid id, CancellationToken ct)
    {
        var user = await userRepository.Query().IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new KeyNotFoundException("User not found.");
        user.IsSuspended = true;
        user.UpdatedAt = DateTime.UtcNow;
        userRepository.Update(user);
        await userRepository.SaveChangesAsync(ct);
        return Ok(ApiResponse.Ok("User suspended"));
    }

    [HttpPatch("users/{id:guid}/activate")]
    public async Task<ActionResult> ActivateUser(Guid id, CancellationToken ct)
    {
        var user = await userRepository.Query().IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new KeyNotFoundException("User not found.");
        user.IsSuspended = false;
        user.IsDeleted = false;
        user.DeletedAt = null;
        user.UpdatedAt = DateTime.UtcNow;
        userRepository.Update(user);
        await userRepository.SaveChangesAsync(ct);
        return Ok(ApiResponse.Ok("User activated"));
    }

    [HttpGet("listings")]
    public async Task<ActionResult<ApiResponse<PagedResult<AdminListingResponse>>>> GetListings([FromQuery] int page = 1, [FromQuery] int pageSize = 15,
        [FromQuery] string? search = null, CancellationToken ct = default)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);

        var q = listingRepository.Query().Include(l => l.Seller).IgnoreQueryFilters().AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(l => l.Title.Contains(search));

        var total = await q.CountAsync(ct);
        var items = await q.OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new AdminListingResponse(
                l.Id,
                l.Title,
                $"{l.Seller.FirstName} {l.Seller.LastName}",
                l.Price,
                (int)l.Status,
                l.IsDeleted,
                l.CreatedAt))
            .ToListAsync(ct);

        return Ok(ApiResponse<PagedResult<AdminListingResponse>>.Ok(
            PagedResult<AdminListingResponse>.Create(items, total, page, pageSize)));
    }

    [HttpGet("orders")]
    public async Task<ActionResult<ApiResponse<PagedResult<AdminOrderResponse>>>> GetOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 15,
        CancellationToken ct = default)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);

        var q = orderRepository.Query().Include(o => o.Buyer).Include(o => o.Items)
            .IgnoreQueryFilters().AsNoTracking();

        var total = await q.CountAsync(ct);
        var items = await q.OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new AdminOrderResponse(
                o.Id,
                o.OrderNumber,
                $"{o.Buyer.FirstName} {o.Buyer.LastName}",
                o.Items.Count,
                o.TotalAmount,
                (int)o.Status,
                o.CreatedAt))
            .ToListAsync(ct);

        return Ok(ApiResponse<PagedResult<AdminOrderResponse>>.Ok(
            PagedResult<AdminOrderResponse>.Create(items, total, page, pageSize)));
    }

    [HttpGet("business-profiles")]
    public async Task<ActionResult<ApiResponse<PagedResult<AdminBusinessProfileResponse>>>> GetBusinessProfiles(
        [FromQuery] PagedQuery query, [FromQuery] string? status, CancellationToken ct)
    {
        var result = await businessProfileService.GetAllAsync(query, status, ct);
        return Ok(ApiResponse<PagedResult<AdminBusinessProfileResponse>>.Ok(result));
    }

    [HttpPut("business-profiles/{id:guid}/review")]
    public async Task<ActionResult<ApiResponse<BusinessProfileResponse>>> ReviewBusinessProfile(
        Guid id, [FromBody] ReviewBusinessProfileRequest request, CancellationToken ct)
    {
        var adminId = Guid.Parse(User.FindFirstValue("sub")!);
        var result = await businessProfileService.ReviewAsync(id, adminId, request.IsApproved, request.RejectionReason, ct);
        return Ok(ApiResponse<BusinessProfileResponse>.Ok(result,
            request.IsApproved ? "Business profile approved" : "Business profile rejected"));
    }

    private static (int Page, int PageSize) NormalizePaging(int page, int pageSize)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize switch
        {
            < 1 => 15,
            > 100 => 100,
            _ => pageSize,
        };

        return (page, pageSize);
    }
}

public record AdminStatsResponse(
    int TotalUsers,
    int ActiveListings,
    int TotalOrders,
    decimal TotalRevenue
);

public record AdminUserResponse(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    int AccountType,
    string Role,
    bool IsEmailVerified,
    bool IsSuspended,
    bool IsDeleted,
    DateTime CreatedAt
);

public record AdminListingResponse(
    Guid Id,
    string Title,
    string SellerName,
    decimal Price,
    int Status,
    bool IsDeleted,
    DateTime CreatedAt
);

public record AdminOrderResponse(
    Guid Id,
    string OrderNumber,
    string BuyerName,
    int ItemCount,
    decimal TotalAmount,
    int Status,
    DateTime CreatedAt
);
