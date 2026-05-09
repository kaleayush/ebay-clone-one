using EBayClone.Application.Common;
using EBayClone.Application.DTOs.Listings;
using EBayClone.Application.Interfaces;
using EBayClone.Domain.Entities;
using EBayClone.Domain.Enums;
using EBayClone.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EBayClone.Application.Services;

public class ListingService(
    IRepository<Listing> listingRepository,
    IRepository<User> userRepository,
    ILogger<ListingService> logger) : IListingService
{
    public async Task<PagedResult<ListingResponse>> GetListingsAsync(ListingQuery query, CancellationToken ct = default)
    {
        var q = listingRepository.Query()
            .Include(l => l.Seller)
            .Include(l => l.Category)
            .AsNoTracking();

        if (query.Status.HasValue)
            q = q.Where(l => l.Status == query.Status.Value);

        if (!string.IsNullOrWhiteSpace(query.Search))
            q = q.Where(l => l.Title.Contains(query.Search) || l.Description.Contains(query.Search));

        if (!string.IsNullOrWhiteSpace(query.Category))
            q = q.Where(l => l.Category != null && l.Category.Name.Contains(query.Category));

        if (query.MinPrice.HasValue)
            q = q.Where(l => l.Price >= query.MinPrice.Value);

        if (query.MaxPrice.HasValue)
            q = q.Where(l => l.Price <= query.MaxPrice.Value);

        if (query.SellerId.HasValue)
            q = q.Where(l => l.SellerId == query.SellerId.Value);

        q = query.SortBy?.ToLower() switch
        {
            "price" => query.SortDirection == "asc" ? q.OrderBy(l => l.Price) : q.OrderByDescending(l => l.Price),
            "title" => query.SortDirection == "asc" ? q.OrderBy(l => l.Title) : q.OrderByDescending(l => l.Title),
            _ => q.OrderByDescending(l => l.CreatedAt),
        };

        var total = await q.CountAsync(ct);
        var items = await q
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(ct);

        return PagedResult<ListingResponse>.Create(
            items.Select(MapToResponse).ToList(),
            total, query.Page, query.PageSize);
    }

    public async Task<ListingResponse> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var listing = await listingRepository.Query()
            .Include(l => l.Seller)
            .Include(l => l.Category)
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == id, ct)
            ?? throw new KeyNotFoundException($"Listing {id} not found.");

        return MapToResponse(listing);
    }

    public async Task<PagedResult<ListingResponse>> GetMyListingsAsync(Guid sellerId, ListingQuery query, CancellationToken ct = default)
    {
        return await GetListingsAsync(query with { SellerId = sellerId }, ct);
    }

    public async Task<ListingResponse> CreateAsync(Guid sellerId, CreateListingRequest request, CancellationToken ct = default)
    {
        var seller = await userRepository.GetByIdAsync(sellerId, ct)
            ?? throw new KeyNotFoundException("Seller not found.");

        var listing = new Listing
        {
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Price = request.Price,
            Quantity = request.Quantity,
            FreeShipping = request.FreeShipping,
            Status = request.Status,
            CategoryId = request.CategoryId,
            SellerId = sellerId,
        };

        await listingRepository.AddAsync(listing, ct);
        await listingRepository.SaveChangesAsync(ct);

        logger.LogInformation("Listing created: {Id} by seller {SellerId}", listing.Id, sellerId);

        listing.Seller = seller;
        return MapToResponse(listing);
    }

    public async Task<ListingResponse> UpdateAsync(Guid id, Guid sellerId, UpdateListingRequest request, CancellationToken ct = default)
    {
        var listing = await listingRepository.Query()
            .Include(l => l.Seller)
            .Include(l => l.Category)
            .FirstOrDefaultAsync(l => l.Id == id, ct)
            ?? throw new KeyNotFoundException($"Listing {id} not found.");

        if (listing.SellerId != sellerId)
            throw new UnauthorizedAccessException("You can only edit your own listings.");

        listing.Title = request.Title.Trim();
        listing.Description = request.Description.Trim();
        listing.Price = request.Price;
        listing.Quantity = request.Quantity;
        listing.FreeShipping = request.FreeShipping;
        listing.CategoryId = request.CategoryId;
        listing.UpdatedAt = DateTime.UtcNow;

        if (request.Status.HasValue)
            listing.Status = request.Status.Value;

        listingRepository.Update(listing);
        await listingRepository.SaveChangesAsync(ct);

        return MapToResponse(listing);
    }

    public async Task DeleteAsync(Guid id, Guid sellerId, CancellationToken ct = default)
    {
        var listing = await listingRepository.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Listing {id} not found.");

        if (listing.SellerId != sellerId)
            throw new UnauthorizedAccessException("You can only delete your own listings.");

        listingRepository.SoftDelete(listing);
        await listingRepository.SaveChangesAsync(ct);
    }

    private static ListingResponse MapToResponse(Listing l) => new(
        l.Id, l.Title, l.Description, l.Price, l.Quantity, l.FreeShipping,
        (int)l.Status, l.PrimaryImageUrl,
        l.SellerId, $"{l.Seller?.FirstName} {l.Seller?.LastName}".Trim(),
        l.CategoryId, l.Category?.Name,
        l.CreatedAt, l.UpdatedAt
    );
}