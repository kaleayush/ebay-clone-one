using EBayClone.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EBayClone.Infrastructure.Data.Configurations;

public class ListingConfiguration : IEntityTypeConfiguration<Listing>
{
    public void Configure(EntityTypeBuilder<Listing> builder)
    {
        builder.HasKey(l => l.Id);

        builder.Property(l => l.Title).IsRequired().HasMaxLength(80);
        builder.Property(l => l.Description).IsRequired();
        builder.Property(l => l.Price).HasPrecision(18, 2);
        builder.Property(l => l.PrimaryImageUrl).HasMaxLength(500);

        builder.HasIndex(l => l.SellerId).HasDatabaseName("IX_Listings_SellerId");
        builder.HasIndex(l => l.Status).HasDatabaseName("IX_Listings_Status");
        builder.HasIndex(l => l.CategoryId).HasDatabaseName("IX_Listings_CategoryId");

        builder.HasQueryFilter(l => !l.IsDeleted);

        builder.HasMany(l => l.Images)
            .WithOne(i => i.Listing)
            .HasForeignKey(i => i.ListingId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}