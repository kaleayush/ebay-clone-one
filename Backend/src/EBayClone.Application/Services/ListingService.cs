using System.Text.Json;
using System.Text.RegularExpressions;
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
    IRepository<Category> categoryRepository,
    ILogger<ListingService> logger) : IListingService
{
    public async Task<PagedResult<ListingResponse>> GetListingsAsync(ListingQuery query, CancellationToken ct = default)
    {
        var q = ListingQueryBase(query.IncludeDeleted)
            .AsNoTracking();

        if (query.Status.HasValue)
            q = q.Where(l => l.Status == query.Status.Value);

        if (query.ListingType.HasValue)
            q = q.Where(l => l.ListingType == query.ListingType.Value);

        if (!string.IsNullOrWhiteSpace(query.Search))
            q = q.Where(l => l.Title.Contains(query.Search) || l.Description.Contains(query.Search));

        if (!string.IsNullOrWhiteSpace(query.Category))
            q = q.Where(l => l.Category != null && l.Category.Name.Contains(query.Category));

        if (query.CategoryId.HasValue)
            q = q.Where(l => l.CategoryId == query.CategoryId.Value);

        if (query.MinPrice.HasValue)
            q = q.Where(l => l.Price >= query.MinPrice.Value);

        if (query.MaxPrice.HasValue)
            q = q.Where(l => l.Price <= query.MaxPrice.Value);

        if (query.FreeShipping == true)
            q = q.Where(l => l.FreeShipping);

        if (query.SellerId.HasValue)
            q = q.Where(l => l.SellerId == query.SellerId.Value);

        if (query.AttributeFilters?.Count > 0)
        {
            foreach (var (attrIdStr, value) in query.AttributeFilters)
            {
                if (!Guid.TryParse(attrIdStr, out var attrId) || string.IsNullOrWhiteSpace(value))
                    continue;
                q = q.Where(l => l.AttributeValues.Any(
                    v => !v.IsDeleted && v.CategoryAttributeId == attrId && v.Value == value));
            }
        }

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
        var listing = await ListingQueryBase(includeDeleted: false)
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

        var metadata = request.CategoryId.HasValue
            ? await GetCategoryAttributesAsync(request.CategoryId.Value, ct)
            : [];

        ValidateListingRequest(request, metadata);

        var listing = new Listing
        {
            SellerId = sellerId,
            Seller = seller,
        };

        ApplyListingRequest(listing, request);
        ApplyAttributeValues(listing, request.AttributeValues, metadata);
        ApplyImages(listing, request.Images);

        await listingRepository.AddAsync(listing, ct);
        await listingRepository.SaveChangesAsync(ct);

        logger.LogInformation("Listing created: {Id} by seller {SellerId}", listing.Id, sellerId);

        return await GetByIdAsync(listing.Id, ct);
    }

    public async Task<ListingResponse> UpdateAsync(Guid id, Guid sellerId, UpdateListingRequest request, CancellationToken ct = default)
    {
        var listing = await ListingQueryBase(includeDeleted: false)
            .FirstOrDefaultAsync(l => l.Id == id, ct)
            ?? throw new KeyNotFoundException($"Listing {id} not found.");

        if (listing.SellerId != sellerId)
            throw new UnauthorizedAccessException("You can only edit your own listings.");

        var metadata = request.CategoryId.HasValue
            ? await GetCategoryAttributesAsync(request.CategoryId.Value, ct)
            : [];

        ValidateListingRequest(request, metadata);

        ApplyListingRequest(listing, request);
        ReplaceAttributeValues(listing, request.AttributeValues, metadata);
        ReplaceImages(listing, request.Images);

        listingRepository.Update(listing);
        await listingRepository.SaveChangesAsync(ct);

        return await GetByIdAsync(listing.Id, ct);
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

    public async Task<ListingResponse> RestoreAsync(Guid id, Guid sellerId, CancellationToken ct = default)
    {
        var listing = await ListingQueryBase(includeDeleted: true)
            .FirstOrDefaultAsync(l => l.Id == id, ct)
            ?? throw new KeyNotFoundException($"Listing {id} not found.");

        if (listing.SellerId != sellerId)
            throw new UnauthorizedAccessException("You can only restore your own listings.");

        listing.IsDeleted = false;
        listing.DeletedAt = null;
        listing.UpdatedAt = DateTime.UtcNow;
        listingRepository.Update(listing);
        await listingRepository.SaveChangesAsync(ct);

        return MapToResponse(listing);
    }

    public async Task<AutocompleteResponse> GetAutocompleteSuggestionsAsync(string q, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
            return new AutocompleteResponse([]);

        var suggestions = await listingRepository.Query()
            .AsNoTracking()
            .Where(l => l.Status == ListingStatus.Active && l.Title.Contains(q))
            .Select(l => l.Title)
            .Distinct()
            .Take(8)
            .ToListAsync(ct);

        return new AutocompleteResponse(suggestions);
    }

    public async Task<SearchFacetsResponse> GetSearchFacetsAsync(Guid? categoryId, string? search, CancellationToken ct = default)
    {
        var q = listingRepository.Query()
            .AsNoTracking()
            .Where(l => l.Status == ListingStatus.Active);

        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(l => l.Title.Contains(search) || l.Description.Contains(search));

        if (categoryId.HasValue)
            q = q.Where(l => l.CategoryId == categoryId.Value);

        var priceStats = await q
            .GroupBy(_ => 1)
            .Select(g => new { Min = g.Min(l => l.Price), Max = g.Max(l => l.Price) })
            .FirstOrDefaultAsync(ct);

        var priceFacet = priceStats != null
            ? new PriceFacet(priceStats.Min, priceStats.Max)
            : null;

        List<AttributeFacet> attributeFacets = [];

        if (categoryId.HasValue)
        {
            var category = await categoryRepository.Query()
                .Include(c => c.Attributes.OrderBy(a => a.SortOrder))
                    .ThenInclude(a => a.Options.Where(o => o.IsActive).OrderBy(o => o.SortOrder))
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == categoryId.Value, ct);

            if (category != null)
            {
                var filterableAttrs = category.Attributes
                    .Where(a => a.DataType is AttributeDataType.Dropdown
                        or AttributeDataType.MultiSelect
                        or AttributeDataType.Boolean)
                    .ToList();

                var filterableAttrIds = filterableAttrs.Select(a => a.Id).ToHashSet();

                var allValueCounts = await listingRepository.Query()
                    .AsNoTracking()
                    .Where(l => l.Status == ListingStatus.Active && l.CategoryId == categoryId.Value)
                    .SelectMany(l => l.AttributeValues
                        .Where(v => !v.IsDeleted && filterableAttrIds.Contains(v.CategoryAttributeId)))
                    .GroupBy(v => new { v.CategoryAttributeId, v.Value })
                    .Select(g => new { g.Key.CategoryAttributeId, g.Key.Value, Count = g.Count() })
                    .ToListAsync(ct);

                var countLookup = allValueCounts
                    .GroupBy(x => x.CategoryAttributeId)
                    .ToDictionary(g => g.Key, g => g.ToDictionary(x => x.Value, x => x.Count));

                foreach (var attr in filterableAttrs)
                {
                    countLookup.TryGetValue(attr.Id, out var attrCounts);
                    attrCounts ??= [];

                    IReadOnlyCollection<FacetOption> options;

                    if (attr.DataType == AttributeDataType.Boolean)
                    {
                        options = new[]
                        {
                            new FacetOption("true", "Yes", attrCounts.GetValueOrDefault("true") + attrCounts.GetValueOrDefault("True")),
                            new FacetOption("false", "No", attrCounts.GetValueOrDefault("false") + attrCounts.GetValueOrDefault("False")),
                        }.Where(o => o.Count > 0).ToList();
                    }
                    else
                    {
                        options = attr.Options
                            .Select(o => new FacetOption(o.Value, o.Label, attrCounts.GetValueOrDefault(o.Value)))
                            .Where(o => o.Count > 0)
                            .ToList();
                    }

                    if (options.Count > 0)
                        attributeFacets.Add(new AttributeFacet(attr.Id, attr.Name, attr.DisplayName, (int)attr.DataType, options));
                }
            }
        }

        return new SearchFacetsResponse(attributeFacets, priceFacet);
    }

    private IQueryable<Listing> ListingQueryBase(bool includeDeleted)
    {
        var q = listingRepository.Query();
        if (includeDeleted)
            q = q.IgnoreQueryFilters();

        return q
            .Include(l => l.Seller)
            .Include(l => l.Category)
            .Include(l => l.Images.OrderBy(i => i.SortOrder))
            .Include(l => l.AttributeValues)
                .ThenInclude(v => v.CategoryAttribute)
                    .ThenInclude(a => a.Options);
    }

    private async Task<IReadOnlyCollection<CategoryAttribute>> GetCategoryAttributesAsync(Guid categoryId, CancellationToken ct)
    {
        var categories = await categoryRepository.Query()
            .Include(c => c.Attributes.OrderBy(a => a.SortOrder).ThenBy(a => a.DisplayName))
                .ThenInclude(a => a.Options.OrderBy(o => o.SortOrder).ThenBy(o => o.Label))
            .AsNoTracking()
            .ToListAsync(ct);

        var category = categories.FirstOrDefault(c => c.Id == categoryId)
            ?? throw new KeyNotFoundException($"Category {categoryId} not found.");

        if (!category.ParentCategoryId.HasValue || categories.Any(c => c.ParentCategoryId == category.Id))
            throw new InvalidOperationException("Listings must be created in a child category that has its own form.");

        return category.Attributes
            .OrderBy(a => a.SortOrder)
            .ThenBy(a => a.DisplayName)
            .ToList();
    }

    private static void ValidateListingRequest(CreateListingRequest request, IReadOnlyCollection<CategoryAttribute> metadata)
    {
        ValidateListingBasics(request.ListingType, request.Price, request.Quantity, request.StartingBid, request.AuctionEndAt);
        ValidateAttributeValues(request.AttributeValues, metadata);
    }

    private static void ValidateListingRequest(UpdateListingRequest request, IReadOnlyCollection<CategoryAttribute> metadata)
    {
        ValidateListingBasics(request.ListingType, request.Price, request.Quantity, request.StartingBid, request.AuctionEndAt);
        ValidateAttributeValues(request.AttributeValues, metadata);
    }

    private static void ValidateListingBasics(
        ListingType listingType,
        decimal price,
        int quantity,
        decimal? startingBid,
        DateTime? auctionEndAt)
    {
        if (listingType == ListingType.FixedPrice && price <= 0)
            throw new InvalidOperationException("Fixed price listings require a price greater than zero.");

        if (listingType == ListingType.Auction)
        {
            if (!startingBid.HasValue || startingBid.Value <= 0)
                throw new InvalidOperationException("Auction listings require a starting bid greater than zero.");

            if (auctionEndAt.HasValue && auctionEndAt.Value <= DateTime.UtcNow)
                throw new InvalidOperationException("Auction end time must be in the future.");
        }

        if (quantity < 1)
            throw new InvalidOperationException("Quantity must be at least 1.");
    }

    private static void ValidateAttributeValues(
        IReadOnlyCollection<ListingAttributeValueRequest>? values,
        IReadOnlyCollection<CategoryAttribute> metadata)
    {
        var submitted = (values ?? [])
            .Where(v => v.CategoryAttributeId != Guid.Empty)
            .GroupBy(v => v.CategoryAttributeId)
            .ToDictionary(g => g.Key, g => g.Last().Value?.Trim());

        var metadataById = metadata.ToDictionary(a => a.Id);

        foreach (var id in submitted.Keys)
        {
            if (!metadataById.ContainsKey(id))
                throw new InvalidOperationException("One or more attribute values do not belong to the selected category.");
        }

        foreach (var attribute in metadata)
        {
            if (!IsConditionMet(attribute, submitted))
                continue;

            submitted.TryGetValue(attribute.Id, out var value);
            var hasValue = !string.IsNullOrWhiteSpace(value);

            if (attribute.IsRequired && !hasValue)
                throw new InvalidOperationException($"{attribute.DisplayName} is required.");

            if (!hasValue)
                continue;

            ValidateAttributeValue(attribute, value!);
        }
    }

    private static bool IsConditionMet(CategoryAttribute attribute, IReadOnlyDictionary<Guid, string?> submitted)
    {
        if (!attribute.ConditionAttributeId.HasValue)
            return true;

        if (!submitted.TryGetValue(attribute.ConditionAttributeId.Value, out var actual) || string.IsNullOrWhiteSpace(actual))
            return false;

        var expected = attribute.ConditionValue ?? string.Empty;
        return attribute.ConditionOperator switch
        {
            ConditionalOperator.NotEquals => !string.Equals(actual, expected, StringComparison.OrdinalIgnoreCase),
            ConditionalOperator.Contains => actual.Contains(expected, StringComparison.OrdinalIgnoreCase),
            ConditionalOperator.GreaterThan => decimal.TryParse(actual, out var a) && decimal.TryParse(expected, out var e) && a > e,
            ConditionalOperator.LessThan => decimal.TryParse(actual, out var a) && decimal.TryParse(expected, out var e) && a < e,
            _ => string.Equals(actual, expected, StringComparison.OrdinalIgnoreCase),
        };
    }

    private static void ValidateAttributeValue(CategoryAttribute attribute, string value)
    {
        if (attribute.MinLength.HasValue && value.Length < attribute.MinLength.Value)
            throw new InvalidOperationException($"{attribute.DisplayName} must be at least {attribute.MinLength.Value} characters.");

        if (attribute.MaxLength.HasValue && value.Length > attribute.MaxLength.Value)
            throw new InvalidOperationException($"{attribute.DisplayName} must be at most {attribute.MaxLength.Value} characters.");

        if (!string.IsNullOrWhiteSpace(attribute.RegexPattern) && !Regex.IsMatch(value, attribute.RegexPattern))
            throw new InvalidOperationException($"{attribute.DisplayName} is invalid.");

        if (attribute.DataType is AttributeDataType.Number or AttributeDataType.Decimal)
        {
            if (!decimal.TryParse(value, out var number))
                throw new InvalidOperationException($"{attribute.DisplayName} must be a number.");

            if (attribute.MinValue.HasValue && number < attribute.MinValue.Value)
                throw new InvalidOperationException($"{attribute.DisplayName} must be at least {attribute.MinValue.Value}.");

            if (attribute.MaxValue.HasValue && number > attribute.MaxValue.Value)
                throw new InvalidOperationException($"{attribute.DisplayName} must be at most {attribute.MaxValue.Value}.");
        }

        if (attribute.DataType == AttributeDataType.Boolean && !bool.TryParse(value, out _))
            throw new InvalidOperationException($"{attribute.DisplayName} must be true or false.");

        if (attribute.DataType == AttributeDataType.Date && !DateTime.TryParse(value, out _))
            throw new InvalidOperationException($"{attribute.DisplayName} must be a valid date.");

        if (attribute.DataType == AttributeDataType.Dropdown)
        {
            var valid = attribute.Options.Where(o => o.IsActive).Select(o => o.Value).ToHashSet(StringComparer.OrdinalIgnoreCase);
            if (!valid.Contains(value))
                throw new InvalidOperationException($"{attribute.DisplayName} must use one of the configured options.");
        }

        if (attribute.DataType == AttributeDataType.MultiSelect)
        {
            var valid = attribute.Options.Where(o => o.IsActive).Select(o => o.Value).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var selected = ParseMultiSelect(value);

            if (selected.Count == 0 || selected.Any(item => !valid.Contains(item)))
                throw new InvalidOperationException($"{attribute.DisplayName} contains an invalid option.");
        }
    }

    private static IReadOnlyCollection<string> ParseMultiSelect(string value)
    {
        try
        {
            return JsonSerializer.Deserialize<IReadOnlyCollection<string>>(value) ?? [];
        }
        catch (JsonException)
        {
            return value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        }
    }

    private static void ApplyListingRequest(Listing listing, CreateListingRequest request)
    {
        listing.Title = request.Title.Trim();
        listing.Description = request.Description.Trim();
        listing.ListingType = request.ListingType;
        listing.Price = request.ListingType == ListingType.Auction ? request.BuyItNowPrice ?? request.StartingBid!.Value : request.Price;
        listing.StartingBid = request.ListingType == ListingType.Auction ? request.StartingBid : null;
        listing.ReservePrice = request.ListingType == ListingType.Auction ? request.ReservePrice : null;
        listing.BuyItNowPrice = request.ListingType == ListingType.Auction ? request.BuyItNowPrice : null;
        listing.AuctionStartAt = request.ListingType == ListingType.Auction ? request.AuctionStartAt ?? DateTime.UtcNow : null;
        listing.AuctionEndAt = request.ListingType == ListingType.Auction ? request.AuctionEndAt : null;
        listing.Quantity = request.Quantity;
        listing.FreeShipping = request.FreeShipping;
        listing.Status = request.Status;
        listing.CategoryId = request.CategoryId;
        listing.UpdatedAt = DateTime.UtcNow;
    }

    private static void ApplyListingRequest(Listing listing, UpdateListingRequest request)
    {
        listing.Title = request.Title.Trim();
        listing.Description = request.Description.Trim();
        listing.ListingType = request.ListingType;
        listing.Price = request.ListingType == ListingType.Auction ? request.BuyItNowPrice ?? request.StartingBid!.Value : request.Price;
        listing.StartingBid = request.ListingType == ListingType.Auction ? request.StartingBid : null;
        listing.ReservePrice = request.ListingType == ListingType.Auction ? request.ReservePrice : null;
        listing.BuyItNowPrice = request.ListingType == ListingType.Auction ? request.BuyItNowPrice : null;
        listing.AuctionStartAt = request.ListingType == ListingType.Auction ? request.AuctionStartAt ?? listing.AuctionStartAt ?? DateTime.UtcNow : null;
        listing.AuctionEndAt = request.ListingType == ListingType.Auction ? request.AuctionEndAt : null;
        listing.Quantity = request.Quantity;
        listing.FreeShipping = request.FreeShipping;
        listing.CategoryId = request.CategoryId;
        listing.UpdatedAt = DateTime.UtcNow;

        if (request.Status.HasValue)
            listing.Status = request.Status.Value;
    }

    private static void ReplaceAttributeValues(
        Listing listing,
        IReadOnlyCollection<ListingAttributeValueRequest>? requests,
        IReadOnlyCollection<CategoryAttribute> metadata)
    {
        foreach (var value in listing.AttributeValues)
        {
            value.IsDeleted = true;
            value.DeletedAt = DateTime.UtcNow;
            value.UpdatedAt = DateTime.UtcNow;
        }

        ApplyAttributeValues(listing, requests, metadata);
    }

    private static void ApplyAttributeValues(
        Listing listing,
        IReadOnlyCollection<ListingAttributeValueRequest>? requests,
        IReadOnlyCollection<CategoryAttribute> metadata)
    {
        var validIds = metadata.Select(a => a.Id).ToHashSet();
        foreach (var request in requests ?? [])
        {
            if (!validIds.Contains(request.CategoryAttributeId) || string.IsNullOrWhiteSpace(request.Value))
                continue;

            listing.AttributeValues.Add(new ListingAttributeValue
            {
                CategoryAttributeId = request.CategoryAttributeId,
                Value = request.Value.Trim(),
            });
        }
    }

    private static void ReplaceImages(Listing listing, IReadOnlyCollection<ListingImageRequest>? requests)
    {
        foreach (var image in listing.Images)
        {
            image.IsDeleted = true;
            image.DeletedAt = DateTime.UtcNow;
            image.UpdatedAt = DateTime.UtcNow;
        }

        ApplyImages(listing, requests);
    }

    private static void ApplyImages(Listing listing, IReadOnlyCollection<ListingImageRequest>? requests)
    {
        foreach (var request in requests ?? [])
        {
            if (string.IsNullOrWhiteSpace(request.Url))
                continue;

            listing.Images.Add(new ListingImage
            {
                Url = request.Url.Trim(),
                AltText = request.AltText?.Trim(),
                SortOrder = request.SortOrder,
            });
        }

        listing.PrimaryImageUrl = listing.Images
            .Where(i => !i.IsDeleted)
            .OrderBy(i => i.SortOrder)
            .Select(i => i.Url)
            .FirstOrDefault();
    }

    private static ListingResponse MapToResponse(Listing l) => new(
        l.Id,
        l.Title,
        l.Description,
        (int)l.ListingType,
        l.Price,
        l.StartingBid,
        l.ReservePrice,
        l.BuyItNowPrice,
        l.AuctionStartAt,
        l.AuctionEndAt,
        l.Quantity,
        l.FreeShipping,
        (int)l.Status,
        l.IsDeleted,
        l.PrimaryImageUrl,
        l.SellerId,
        $"{l.Seller?.FirstName} {l.Seller?.LastName}".Trim(),
        l.CategoryId,
        l.Category?.Name,
        l.AttributeValues
            .Where(v => !v.IsDeleted)
            .OrderBy(v => v.CategoryAttribute.SortOrder)
            .Select(MapAttributeValueToResponse)
            .ToList(),
        l.Images
            .Where(i => !i.IsDeleted)
            .OrderBy(i => i.SortOrder)
            .Select(i => new ListingImageResponse(i.Id, i.Url, i.AltText, i.SortOrder))
            .ToList(),
        l.CreatedAt,
        l.UpdatedAt
    );

    private static ListingAttributeValueResponse MapAttributeValueToResponse(ListingAttributeValue v) =>
        new(
            v.CategoryAttributeId,
            v.CategoryAttribute.Name,
            v.CategoryAttribute.DisplayName,
            (int)v.CategoryAttribute.DataType,
            v.Value,
            GetDisplayValue(v));

    private static string? GetDisplayValue(ListingAttributeValue v)
    {
        if (v.CategoryAttribute.DataType == AttributeDataType.MultiSelect)
        {
            var selected = ParseMultiSelect(v.Value).ToHashSet(StringComparer.OrdinalIgnoreCase);
            return string.Join(", ", v.CategoryAttribute.Options
                .Where(o => selected.Contains(o.Value))
                .OrderBy(o => o.SortOrder)
                .Select(o => o.Label));
        }

        if (v.CategoryAttribute.DataType == AttributeDataType.Dropdown)
            return v.CategoryAttribute.Options.FirstOrDefault(o => o.Value == v.Value)?.Label ?? v.Value;

        return v.Value;
    }
}
