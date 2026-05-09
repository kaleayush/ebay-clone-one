using EBayClone.Application.Interfaces;
using EBayClone.Domain.Entities;
using EBayClone.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EBayClone.Application.Services;

public class CategoryService(IRepository<Category> categoryRepository) : ICategoryService
{
    public async Task<IEnumerable<CategoryResponse>> GetAllAsync(CancellationToken ct = default)
    {
        var categories = await categoryRepository.Query()
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .AsNoTracking()
            .ToListAsync(ct);

        return categories.Select(MapToResponse);
    }

    public async Task<CategoryResponse> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var category = await categoryRepository.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Category {id} not found.");
        return MapToResponse(category);
    }

    public async Task<CategoryResponse> CreateAsync(CategoryRequest request, CancellationToken ct = default)
    {
        var category = new Category
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            ParentCategoryId = request.ParentCategoryId,
        };

        await categoryRepository.AddAsync(category, ct);
        await categoryRepository.SaveChangesAsync(ct);
        return MapToResponse(category);
    }

    public async Task<CategoryResponse> UpdateAsync(Guid id, CategoryRequest request, CancellationToken ct = default)
    {
        var category = await categoryRepository.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Category {id} not found.");

        category.Name = request.Name.Trim();
        category.Description = request.Description?.Trim();
        category.ParentCategoryId = request.ParentCategoryId;
        category.UpdatedAt = DateTime.UtcNow;

        categoryRepository.Update(category);
        await categoryRepository.SaveChangesAsync(ct);
        return MapToResponse(category);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var category = await categoryRepository.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Category {id} not found.");
        categoryRepository.SoftDelete(category);
        await categoryRepository.SaveChangesAsync(ct);
    }

    private static CategoryResponse MapToResponse(Category c) =>
        new(c.Id, c.Name, c.Description, c.ParentCategoryId, c.SortOrder);
}