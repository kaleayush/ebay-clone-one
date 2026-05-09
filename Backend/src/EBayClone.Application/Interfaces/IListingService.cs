using EBayClone.Application.Common;
using EBayClone.Application.DTOs.Listings;

namespace EBayClone.Application.Interfaces;

public interface IListingService
{
    Task<PagedResult<ListingResponse>> GetListingsAsync(ListingQuery query, CancellationToken ct = default);
    Task<ListingResponse> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<PagedResult<ListingResponse>> GetMyListingsAsync(Guid sellerId, ListingQuery query, CancellationToken ct = default);
    Task<ListingResponse> CreateAsync(Guid sellerId, CreateListingRequest request, CancellationToken ct = default);
    Task<ListingResponse> UpdateAsync(Guid id, Guid sellerId, UpdateListingRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, Guid sellerId, CancellationToken ct = default);
    Task<ListingResponse> RestoreAsync(Guid id, Guid sellerId, CancellationToken ct = default);
}
