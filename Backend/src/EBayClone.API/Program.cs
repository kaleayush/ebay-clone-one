using EBayClone.API.Extensions;
using EBayClone.API.Middleware;
using EBayClone.Application.Extensions;
using EBayClone.Infrastructure.Data;
using EBayClone.Infrastructure.Data.Seed;
using EBayClone.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// ===== Serilog =====
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

// ===== Services =====
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerWithJwt();
builder.Services.AddHealthChecks();

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddCorsPolicy(builder.Configuration);

// ===== App =====
var app = builder.Build();

// Ensure uploads directory exists
var uploadsDir = Path.Combine(
    builder.Configuration["FileStorage:UploadDirectory"] ?? "wwwroot/uploads",
    "documents");
Directory.CreateDirectory(uploadsDir);

// Auto-migrate database on startup
// using (var scope = app.Services.CreateScope())
// {
//    try
//    {
//        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
//        await db.Database.MigrateAsync();
//        await CategoryFormSeeder.SeedAsync(db);
//        await ListingAndUserSeeder.SeedAsync(db);
//        await EmailTemplateSeeder.SeedAsync(db);
//        Log.Information("Database migration applied successfully");
//    }
//    catch (Exception ex)
//    {
//        Log.Error(ex, "Failed to apply database migrations");
//    }
// }

app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "eBay Clone API v1");
    c.RoutePrefix = "swagger";
});

app.UseStaticFiles();
app.UseSerilogRequestLogging();
app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

var urls = Environment.GetEnvironmentVariable("ASPNETCORE_URLS")
    ?? app.Urls.FirstOrDefault()
 ?? "http://localhost:5005";
var baseUrl = urls.Split(';')[0].TrimEnd('/');

Log.Information("===========================================");
Log.Information("  eBay Clone API");
Log.Information("  Environment : {Environment}", app.Environment.EnvironmentName);
Log.Information("  Listening   : {Url}", urls);
Log.Information("  Swagger     : {Swagger}", $"{baseUrl}/swagger");
Log.Information("===========================================");

app.Run();
