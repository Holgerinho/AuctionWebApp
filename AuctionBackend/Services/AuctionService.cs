using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using AuctionBackend.Data;
using AuctionBackend.DTOs;
using AuctionBackend.Interfaces;
using AuctionBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace AuctionBackend.Services
{
    public class AuctionService : IAuctionService
    {
        private readonly AppDbContext _dbContext;

        public AuctionService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<IEnumerable<AuctionResponseDto>> GetOpenAuctionsAsync()
        {
            return await _dbContext.Auctions
                .Where(a => a.IsActive && a.EndsAt > DateTime.UtcNow)
                .OrderBy(a => a.EndsAt)
                .Select(MapAuctionResponse())
                .ToListAsync();
        }

        public async Task<IEnumerable<AuctionResponseDto>> SearchOpenAuctionsAsync(string title)
        {
            if (string.IsNullOrWhiteSpace(title))
            {
                return new List<AuctionResponseDto>();
            }

            return await _dbContext.Auctions
                .Where(a =>
                    a.IsActive
                    && a.EndsAt > DateTime.UtcNow
                    && (a.Title.Contains(title) || a.Description.Contains(title))
                )
                .OrderBy(a => a.EndsAt)
                .Select(MapAuctionResponse())
                .ToListAsync();
        }

        public async Task<IEnumerable<AuctionResponseDto>> GetClosedAuctionsAsync(string? title)
        {
            var query = _dbContext.Auctions
                .Where(a => a.IsActive && a.EndsAt <= DateTime.UtcNow);

            if (!string.IsNullOrWhiteSpace(title))
            {
                query = query.Where(a => a.Title.Contains(title) || a.Description.Contains(title));
            }

            return await query
                .OrderByDescending(a => a.EndsAt)
                .Select(MapAuctionResponse())
                .ToListAsync();
        }

        public async Task<IEnumerable<AuctionResponseDto>> GetMyAuctionsAsync(int userId)
        {
            return await _dbContext.Auctions
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.EndsAt)
                .Select(MapAuctionResponse())
                .ToListAsync();
        }

        public async Task<IEnumerable<AuctionResponseDto>> GetAuctionsIBidOnAsync(int userId)
        {
            return await _dbContext.Auctions
                .Where(a => a.Bids.Any(b => b.UserId == userId))
                .OrderByDescending(a => a.EndsAt)
                .Select(MapAuctionResponse())
                .ToListAsync();
        }

        public async Task<AuctionResponseDto?> GetByIdAsync(int id)
        {
            return await _dbContext.Auctions
                .Where(a => a.Id == id)
                .Select(MapAuctionResponse())
                .FirstOrDefaultAsync();
        }

        public async Task<OperationResult<AuctionResponseDto>> CreateAsync(CreateAuctionDto dto, int userId)
        {
            var startsAtUtc = NormalizeToUtc(dto.StartsAt);
            var endsAtUtc = NormalizeToUtc(dto.EndsAt);

            if (
                string.IsNullOrWhiteSpace(dto.Title)
                || dto.StartingPrice <= 0
                || startsAtUtc >= endsAtUtc
                || endsAtUtc <= DateTime.UtcNow
            )
            {
                return OperationResult<AuctionResponseDto>.Failure(400, "Title, starting price, valid start date, and a future end date are required.");
            }

            var auction = new Auction
            {
                Title = dto.Title,
                Description = dto.Description,
                StartingPrice = dto.StartingPrice,
                CurrentPrice = dto.StartingPrice,
                StartsAt = startsAtUtc,
                EndsAt = endsAtUtc,
                UserId = userId,
                Images = (dto.ImageUrls ?? new List<string>())
                    .Where(url => !string.IsNullOrWhiteSpace(url))
                    .Take(8)
                    .Select(url => new AuctionImage { Url = url })
                    .ToList()
            };

            _dbContext.Auctions.Add(auction);
            await _dbContext.SaveChangesAsync();

            return OperationResult<AuctionResponseDto>.Success(new AuctionResponseDto
            {
                Id = auction.Id,
                Title = auction.Title,
                Description = auction.Description,
                StartingPrice = auction.StartingPrice,
                CurrentPrice = auction.CurrentPrice,
                CurrentHighestBidUserId = null,
                ImageUrls = auction.Images.Select(i => i.Url).ToList(),
                StartsAt = DateTime.SpecifyKind(auction.StartsAt, DateTimeKind.Utc),
                EndsAt = DateTime.SpecifyKind(auction.EndsAt, DateTimeKind.Utc),
                IsActive = auction.IsActive,
                UserId = auction.UserId
            }, 201);
        }

        public async Task<OperationResult<AuctionResponseDto>> UpdateAsync(int id, UpdateAuctionDto dto, int userId)
        {
            var startsAtUtc = NormalizeToUtc(dto.StartsAt);
            var endsAtUtc = NormalizeToUtc(dto.EndsAt);

            if (
                string.IsNullOrWhiteSpace(dto.Title)
                || dto.StartingPrice <= 0
                || startsAtUtc >= endsAtUtc
                || endsAtUtc <= DateTime.UtcNow
            )
            {
                return OperationResult<AuctionResponseDto>.Failure(400, "Title, starting price, valid start date, and a future end date are required.");
            }

            var auction = await _dbContext.Auctions.FirstOrDefaultAsync(a => a.Id == id);
            if (auction == null)
            {
                return OperationResult<AuctionResponseDto>.Failure(404);
            }

            if (auction.UserId != userId)
            {
                return OperationResult<AuctionResponseDto>.Failure(403);
            }

            var hasBids = await _dbContext.Bids.AnyAsync(b => b.AuctionId == id);
            if (hasBids && dto.StartingPrice != auction.StartingPrice)
            {
                return OperationResult<AuctionResponseDto>.Failure(400, "Starting price cannot be changed after bids have been placed.");
            }

            auction.Title = dto.Title;
            auction.Description = dto.Description;
            auction.StartingPrice = dto.StartingPrice;
            if (!hasBids)
            {
                auction.CurrentPrice = dto.StartingPrice;
            }
            auction.StartsAt = startsAtUtc;
            auction.EndsAt = endsAtUtc;
            auction.IsActive = dto.IsActive;

            var existingImages = await _dbContext.AuctionImages
                .Where(i => i.AuctionId == auction.Id)
                .ToListAsync();
            _dbContext.AuctionImages.RemoveRange(existingImages);

            var newImages = (dto.ImageUrls ?? new List<string>())
                .Where(url => !string.IsNullOrWhiteSpace(url))
                .Take(8)
                .Select(url => new AuctionImage { AuctionId = auction.Id, Url = url })
                .ToList();
            _dbContext.AuctionImages.AddRange(newImages);

            await _dbContext.SaveChangesAsync();

            var currentHighestBidUserId = await _dbContext.Bids
                .Where(b => b.AuctionId == auction.Id)
                .OrderByDescending(b => b.Amount)
                .ThenByDescending(b => b.CreatedAt)
                .ThenByDescending(b => b.Id)
                .Select(b => (int?)b.UserId)
                .FirstOrDefaultAsync();

            var imageUrls = await _dbContext.AuctionImages
                .Where(i => i.AuctionId == auction.Id)
                .Select(i => i.Url)
                .ToListAsync();

            return OperationResult<AuctionResponseDto>.Success(new AuctionResponseDto
            {
                Id = auction.Id,
                Title = auction.Title,
                Description = auction.Description,
                StartingPrice = auction.StartingPrice,
                CurrentPrice = auction.CurrentPrice,
                CurrentHighestBidUserId = currentHighestBidUserId,
                ImageUrls = imageUrls,
                StartsAt = DateTime.SpecifyKind(auction.StartsAt, DateTimeKind.Utc),
                EndsAt = DateTime.SpecifyKind(auction.EndsAt, DateTimeKind.Utc),
                IsActive = auction.IsActive,
                UserId = auction.UserId
            });
        }

        public async Task<OperationResult<IEnumerable<BidResponseDto>>> GetBidsAsync(int auctionId)
        {
            var auctionExists = await _dbContext.Auctions.AnyAsync(a => a.Id == auctionId);
            if (!auctionExists)
            {
                return OperationResult<IEnumerable<BidResponseDto>>.Failure(404, "Auction not found.");
            }

            var bids = await _dbContext.Bids
                .Where(b => b.AuctionId == auctionId)
                .OrderByDescending(b => b.Amount)
                .Select(b => new BidResponseDto
                {
                    Id = b.Id,
                    Amount = b.Amount,
                    CreatedAt = b.CreatedAt,
                    UserId = b.UserId,
                    AuctionId = b.AuctionId
                })
                .ToListAsync();

            return OperationResult<IEnumerable<BidResponseDto>>.Success(bids);
        }

        public async Task<OperationResult<BidResponseDto>> CreateBidAsync(int auctionId, CreateBidDto dto, int userId)
        {
            if (dto.Amount <= 0)
            {
                return OperationResult<BidResponseDto>.Failure(400, "Bid amount must be greater than zero.");
            }

            var auction = await _dbContext.Auctions
                .Include(a => a.Bids)
                .FirstOrDefaultAsync(a => a.Id == auctionId);

            if (auction == null)
            {
                return OperationResult<BidResponseDto>.Failure(404, "Auction not found.");
            }

            if (!auction.IsActive || auction.EndsAt <= DateTime.UtcNow)
            {
                return OperationResult<BidResponseDto>.Failure(400, "Auction is closed.");
            }

            if (auction.UserId == userId)
            {
                return OperationResult<BidResponseDto>.Failure(400, "You cannot bid on your own auction.");
            }

            var currentHighest = auction.Bids.Count == 0
                ? auction.StartingPrice
                : auction.Bids.Max(b => b.Amount);

            if (dto.Amount <= currentHighest)
            {
                return OperationResult<BidResponseDto>.Failure(400, "Bid must be higher than the current highest bid.");
            }

            var bid = new Bid
            {
                Amount = dto.Amount,
                AuctionId = auctionId,
                UserId = userId
            };

            auction.CurrentPrice = dto.Amount;
            _dbContext.Bids.Add(bid);
            await _dbContext.SaveChangesAsync();

            return OperationResult<BidResponseDto>.Success(new BidResponseDto
            {
                Id = bid.Id,
                Amount = bid.Amount,
                CreatedAt = bid.CreatedAt,
                UserId = bid.UserId,
                AuctionId = bid.AuctionId
            });
        }

        private static Expression<Func<Auction, AuctionResponseDto>> MapAuctionResponse()
        {
            return a => new AuctionResponseDto
            {
                Id = a.Id,
                Title = a.Title,
                Description = a.Description,
                StartingPrice = a.StartingPrice,
                CurrentPrice = a.CurrentPrice,
                CurrentHighestBidUserId = a.Bids
                    .OrderByDescending(b => b.Amount)
                    .ThenByDescending(b => b.CreatedAt)
                    .ThenByDescending(b => b.Id)
                    .Select(b => (int?)b.UserId)
                    .FirstOrDefault(),
                ImageUrls = a.Images.Select(i => i.Url).ToList(),
                StartsAt = DateTime.SpecifyKind(a.StartsAt, DateTimeKind.Utc),
                EndsAt = DateTime.SpecifyKind(a.EndsAt, DateTimeKind.Utc),
                IsActive = a.IsActive,
                UserId = a.UserId
            };
        }

        private static DateTime NormalizeToUtc(DateTime value)
        {
            if (value.Kind == DateTimeKind.Utc)
            {
                return value;
            }

            if (value.Kind == DateTimeKind.Local)
            {
                return value.ToUniversalTime();
            }

            return DateTime.SpecifyKind(value, DateTimeKind.Local).ToUniversalTime();
        }
    }
}
