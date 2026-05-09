using EBayClone.Application.DTOs.Listings;
using EBayClone.Domain.Enums;
using FluentValidation;

namespace EBayClone.Application.Validators;

public class CreateListingRequestValidator : AbstractValidator<CreateListingRequest>
{
    public CreateListingRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required")
            .MinimumLength(3).WithMessage("Title must be at least 3 characters")
            .MaximumLength(80);

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required")
            .MinimumLength(10);

        RuleFor(x => x.Price)
            .GreaterThan(0).When(x => x.ListingType == ListingType.FixedPrice)
            .WithMessage("Price must be greater than 0");

        RuleFor(x => x.StartingBid)
            .NotNull().GreaterThan(0)
            .When(x => x.ListingType == ListingType.Auction)
            .WithMessage("Auction listings require a starting bid greater than 0");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be at least 1");
    }
}

public class UpdateListingRequestValidator : AbstractValidator<UpdateListingRequest>
{
    public UpdateListingRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MinimumLength(3).MaximumLength(80);
        RuleFor(x => x.Description).NotEmpty().MinimumLength(10);
        RuleFor(x => x.Price)
            .GreaterThan(0).When(x => x.ListingType == ListingType.FixedPrice)
            .WithMessage("Price must be greater than 0");
        RuleFor(x => x.StartingBid)
            .NotNull().GreaterThan(0)
            .When(x => x.ListingType == ListingType.Auction)
            .WithMessage("Auction listings require a starting bid greater than 0");
        RuleFor(x => x.Quantity).GreaterThan(0);
    }
}
