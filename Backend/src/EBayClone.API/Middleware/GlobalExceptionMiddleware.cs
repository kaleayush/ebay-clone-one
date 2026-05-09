using System.Net;
using System.Text.Json;
using EBayClone.Application.Common;
using FluentValidation;

namespace EBayClone.API.Middleware;

public class GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, response) = exception switch
        {
            ValidationException validationEx => (
                HttpStatusCode.BadRequest,
                ApiResponse.Fail("Validation failed", validationEx.Errors.Select(e => e.ErrorMessage))),

            KeyNotFoundException => (
                HttpStatusCode.NotFound,
                ApiResponse.Fail(exception.Message)),

            UnauthorizedAccessException => (
                HttpStatusCode.Unauthorized,
                ApiResponse.Fail(exception.Message)),

            InvalidOperationException => (
                HttpStatusCode.Conflict,
                ApiResponse.Fail(exception.Message)),

            _ => (
                HttpStatusCode.InternalServerError,
                ApiResponse.Fail("An unexpected error occurred. Please try again later.")),
        };

        if (exception is not (KeyNotFoundException or UnauthorizedAccessException or InvalidOperationException or ValidationException))
        {
            logger.LogError(exception, "Unhandled exception: {Message}", exception.Message);
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        });

        await context.Response.WriteAsync(json);
    }
}