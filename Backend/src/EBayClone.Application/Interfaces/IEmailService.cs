namespace EBayClone.Application.Interfaces;

public interface IEmailService
{
    Task SendEmailVerificationAsync(string email, string firstName, string token, CancellationToken ct = default);
    Task SendPasswordResetAsync(string email, string firstName, string token, CancellationToken ct = default);
    Task SendPasswordChangedNotificationAsync(string email, string firstName, CancellationToken ct = default);
    Task SendBusinessProfileSubmittedAsync(string email, string firstName, CancellationToken ct = default);
    Task SendBusinessProfileReviewedAsync(string email, string firstName, bool isApproved, string? rejectionReason, CancellationToken ct = default);
}
