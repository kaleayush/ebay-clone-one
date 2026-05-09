namespace EBayClone.Application.Interfaces;

public interface IFileStorageService
{
    Task<string> UploadAsync(Stream fileStream, string fileName, string contentType, CancellationToken ct = default, string folder = "documents");
    Task DeleteAsync(string fileUrl, CancellationToken ct = default);
}
