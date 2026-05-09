namespace EBayClone.Application.Interfaces;

public interface ICategoryService
{
    Task<IEnumerable<CategoryResponse>> GetAllAsync(CancellationToken ct = default);
    Task<CategoryResponse> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<CategoryResponse> CreateAsync(CategoryRequest request, CancellationToken ct = default);
    Task<CategoryResponse> UpdateAsync(Guid id, CategoryRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}

public record CategoryRequest(string Name, string? Description = null, Guid? ParentCategoryId = null);

public record CategoryResponse(
    Guid Id,
    string Name,
    string? Description,
    Guid? ParentCategoryId,
    int SortOrder
);