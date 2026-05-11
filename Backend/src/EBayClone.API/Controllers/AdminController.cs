using System.Security.Claims;
using EBayClone.Application.Common;
using EBayClone.Application.DTOs.BusinessProfile;
using EBayClone.Application.Interfaces;
using EBayClone.Domain.Entities;
using EBayClone.Domain.Enums;
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
        [FromQuery] string? search = null, [FromQuery] int? accountType = null, [FromQuery] string? role = null,
        [FromQuery] string? status = null, [FromQuery] string? sortBy = "createdAt", [FromQuery] string? sortDirection = "desc",
        CancellationToken ct = default)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);

        var q = userRepository.Query().IgnoreQueryFilters().AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(u => u.Email.Contains(search) || u.FirstName.Contains(search) || u.LastName.Contains(search));

        if (accountType.HasValue && Enum.IsDefined(typeof(AccountType), accountType.Value))
            q = q.Where(u => u.AccountType == (AccountType)accountType.Value);

        if (!string.IsNullOrWhiteSpace(role) && Enum.TryParse<UserRole>(role, true, out var parsedRole))
            q = q.Where(u => u.Role == parsedRole);

        q = status?.ToLowerInvariant() switch
        {
            "active" => q.Where(u => !u.IsDeleted && !u.IsSuspended),
            "suspended" => q.Where(u => u.IsSuspended),
            "deleted" => q.Where(u => u.IsDeleted),
            "unverified" => q.Where(u => !u.IsEmailVerified),
            _ => q,
        };

        var total = await q.CountAsync(ct);
        q = (sortBy?.ToLowerInvariant(), sortDirection?.ToLowerInvariant()) switch
        {
            ("name", "asc") => q.OrderBy(u => u.FirstName).ThenBy(u => u.LastName),
            ("name", _) => q.OrderByDescending(u => u.FirstName).ThenByDescending(u => u.LastName),
            ("email", "asc") => q.OrderBy(u => u.Email),
            ("email", _) => q.OrderByDescending(u => u.Email),
            ("accounttype", "asc") => q.OrderBy(u => u.AccountType),
            ("accounttype", _) => q.OrderByDescending(u => u.AccountType),
            ("role", "asc") => q.OrderBy(u => u.Role),
            ("role", _) => q.OrderByDescending(u => u.Role),
            ("createdat", "asc") => q.OrderBy(u => u.CreatedAt),
            _ => q.OrderByDescending(u => u.CreatedAt),
        };

        var items = await q
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
        [FromQuery] string? search = null, [FromQuery] int? status = null, [FromQuery] string? visibility = null,
        [FromQuery] string? sortBy = "createdAt", [FromQuery] string? sortDirection = "desc", CancellationToken ct = default)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);

        var q = listingRepository.Query().Include(l => l.Seller).IgnoreQueryFilters().AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(l => l.Title.Contains(search) || l.Seller.Email.Contains(search) ||
                l.Seller.FirstName.Contains(search) || l.Seller.LastName.Contains(search));

        if (status.HasValue && Enum.IsDefined(typeof(ListingStatus), status.Value))
            q = q.Where(l => l.Status == (ListingStatus)status.Value);

        q = visibility?.ToLowerInvariant() switch
        {
            "active" => q.Where(l => !l.IsDeleted),
            "deleted" => q.Where(l => l.IsDeleted),
            _ => q,
        };

        var total = await q.CountAsync(ct);
        q = (sortBy?.ToLowerInvariant(), sortDirection?.ToLowerInvariant()) switch
        {
            ("title", "asc") => q.OrderBy(l => l.Title),
            ("title", _) => q.OrderByDescending(l => l.Title),
            ("seller", "asc") => q.OrderBy(l => l.Seller.FirstName).ThenBy(l => l.Seller.LastName),
            ("seller", _) => q.OrderByDescending(l => l.Seller.FirstName).ThenByDescending(l => l.Seller.LastName),
            ("price", "asc") => q.OrderBy(l => l.Price - l.DiscountAmount),
            ("price", _) => q.OrderByDescending(l => l.Price - l.DiscountAmount),
            ("status", "asc") => q.OrderBy(l => l.Status),
            ("status", _) => q.OrderByDescending(l => l.Status),
            ("updatedat", "asc") => q.OrderBy(l => l.UpdatedAt),
            ("updatedat", _) => q.OrderByDescending(l => l.UpdatedAt),
            ("createdat", "asc") => q.OrderBy(l => l.CreatedAt),
            _ => q.OrderByDescending(l => l.CreatedAt),
        };

        var items = await q
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new AdminListingResponse(
                l.Id,
                l.Title,
                $"{l.Seller.FirstName} {l.Seller.LastName}",
                l.Price,
                l.DiscountAmount,
                l.Price - l.DiscountAmount,
                (int)l.Status,
                l.IsDeleted,
                l.CreatedAt))
            .ToListAsync(ct);

        return Ok(ApiResponse<PagedResult<AdminListingResponse>>.Ok(
            PagedResult<AdminListingResponse>.Create(items, total, page, pageSize)));
    }

    [HttpGet("orders")]
    public async Task<ActionResult<ApiResponse<PagedResult<AdminOrderResponse>>>> GetOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 15,
        [FromQuery] string? search = null, [FromQuery] int? status = null,
        [FromQuery] string? sortBy = "createdAt", [FromQuery] string? sortDirection = "desc",
        CancellationToken ct = default)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);

        var q = orderRepository.Query().Include(o => o.Buyer).Include(o => o.Items)
            .IgnoreQueryFilters().AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(o => o.OrderNumber.Contains(search) || o.Buyer.Email.Contains(search) ||
                o.Buyer.FirstName.Contains(search) || o.Buyer.LastName.Contains(search));

        if (status.HasValue && Enum.IsDefined(typeof(OrderStatus), status.Value))
            q = q.Where(o => o.Status == (OrderStatus)status.Value);

        var total = await q.CountAsync(ct);
        q = (sortBy?.ToLowerInvariant(), sortDirection?.ToLowerInvariant()) switch
        {
            ("ordernumber", "asc") => q.OrderBy(o => o.OrderNumber),
            ("ordernumber", _) => q.OrderByDescending(o => o.OrderNumber),
            ("buyer", "asc") => q.OrderBy(o => o.Buyer.FirstName).ThenBy(o => o.Buyer.LastName),
            ("buyer", _) => q.OrderByDescending(o => o.Buyer.FirstName).ThenByDescending(o => o.Buyer.LastName),
            ("itemcount", "asc") => q.OrderBy(o => o.Items.Count),
            ("itemcount", _) => q.OrderByDescending(o => o.Items.Count),
            ("totalamount", "asc") => q.OrderBy(o => o.TotalAmount),
            ("totalamount", _) => q.OrderByDescending(o => o.TotalAmount),
            ("status", "asc") => q.OrderBy(o => o.Status),
            ("status", _) => q.OrderByDescending(o => o.Status),
            ("createdat", "asc") => q.OrderBy(o => o.CreatedAt),
            _ => q.OrderByDescending(o => o.CreatedAt),
        };

        var items = await q
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
    decimal DiscountAmount,
    decimal FinalPrice,
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
