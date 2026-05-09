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
        [FromForm] IFormFile? file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(ApiResponse.Fail("Image is required"));

        if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return BadRequest(ApiResponse.Fail("Only image uploads are allowed"));

        await using var stream = file.OpenReadStream();
        var url = await fileStorageService.UploadAsync(stream, file.FileName, file.ContentType, ct, "listings");
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
