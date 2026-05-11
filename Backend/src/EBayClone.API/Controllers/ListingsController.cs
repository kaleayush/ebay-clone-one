using System.Security.Claims;
using EBayClone.Application.Common;
using EBayClone.Application.DTOs.Listings;
using EBayClone.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EBayClone.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class ListingsController(
    IListingService listingService,
    IFileStorageService fileStorageService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<ListingResponse>>>> GetAll(
        [FromQuery] ListingQuery query, CancellationToken ct)
    {
        var result = await listingService.GetListingsAsync(query, ct);
        return Ok(ApiResponse<PagedResult<ListingResponse>>.Ok(result));
    }

    [HttpGet("autocomplete")]
    public async Task<ActionResult<ApiResponse<AutocompleteResponse>>> Autocomplete(
        [FromQuery] string? q, CancellationToken ct)
    {
        var result = await listingService.GetAutocompleteSuggestionsAsync(q ?? string.Empty, ct);
        return Ok(ApiResponse<AutocompleteResponse>.Ok(result));
    }

    [HttpGet("facets")]
    public async Task<ActionResult<ApiResponse<SearchFacetsResponse>>> GetFacets(
        [FromQuery] Guid? categoryId, [FromQuery] string? search, CancellationToken ct)
    {
        var result = await listingService.GetSearchFacetsAsync(categoryId, search, ct);
        return Ok(ApiResponse<SearchFacetsResponse>.Ok(result));
    }

    [HttpGet("recently-viewed")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ListingResponse>>>> GetRecentlyViewed(
        [FromQuery] int days = 3, [FromQuery] int take = 12, CancellationToken ct = default)
    {
        var result = await listingService.GetRecentlyViewedAsync(GetUserId(), days, take, ct);
        return Ok(ApiResponse<IReadOnlyList<ListingResponse>>.Ok(result));
    }

    [HttpPost("{id:guid}/views")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> RecordView(Guid id, CancellationToken ct)
    {
        await listingService.RecordViewAsync(GetUserId(), id, ct);
        return Ok(ApiResponse.Ok("Listing view recorded"));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<ListingResponse>>> GetById(Guid id, CancellationToken ct)
    {
        var result = await listingService.GetByIdAsync(id, ct);
        return Ok(ApiResponse<ListingResponse>.Ok(result));
    }

    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<PagedResult<ListingResponse>>>> GetMyListings(
        [FromQuery] ListingQuery query, CancellationToken ct)
    {
        var sellerId = GetUserId();
        var result = await listingService.GetMyListingsAsync(sellerId, query, ct);
        return Ok(ApiResponse<PagedResult<ListingResponse>>.Ok(result));
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ApiResponse<ListingResponse>>> Create(
        [FromBody] CreateListingRequest request, CancellationToken ct)
    {
        var sellerId = GetUserId();
        var result = await listingService.CreateAsync(sellerId, request, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<ListingResponse>.Ok(result, "Listing created"));
    }

    [HttpPost("images")]
    [Authorize]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<ListingImageUploadResponse>>> UploadImage(
        [FromForm] ImageUploadRequest request, CancellationToken ct)
    {
        if (request.File is null || request.File.Length == 0)
            return BadRequest(ApiResponse.Fail("Image is required"));

        if (!request.File.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return BadRequest(ApiResponse.Fail("Only image uploads are allowed"));

        await using var stream = request.File.OpenReadStream();
        var url = await fileStorageService.UploadAsync(stream, request.File.FileName, request.File.ContentType, ct, "listings");
        return Ok(ApiResponse<ListingImageUploadResponse>.Ok(new ListingImageUploadResponse(url), "Image uploaded"));
    }

    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<ListingResponse>>> Update(
        Guid id, [FromBody] UpdateListingRequest request, CancellationToken ct)
    {
        var sellerId = GetUserId();
        var result = await listingService.UpdateAsync(id, sellerId, request, ct);
        return Ok(ApiResponse<ListingResponse>.Ok(result, "Listing updated"));
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> Delete(Guid id, CancellationToken ct)
    {
        var sellerId = GetUserId();
        await listingService.DeleteAsync(id, sellerId, ct);
        return Ok(ApiResponse.Ok("Listing deleted"));
    }

    [HttpPatch("{id:guid}/restore")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<ListingResponse>>> Restore(Guid id, CancellationToken ct)
    {
        var sellerId = GetUserId();
        var result = await listingService.RestoreAsync(id, sellerId, ct);
        return Ok(ApiResponse<ListingResponse>.Ok(result, "Listing restored"));
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue("sub")!);
}

public class ImageUploadRequest
{
    public IFormFile? File { get; set; }
}
