using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using AuctionBackend.Data;
using AuctionBackend.DTOs;
using AuctionBackend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AuctionBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuctionsController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public AuctionsController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AuctionResponseDto>>> GetAuctions()
        {
            var query = _dbContext.Auctions
                .Where(a => a.IsActive && a.EndsAt > DateTime.UtcNow)
                .OrderBy(a => a.EndsAt)
                .Select(a => new AuctionResponseDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Description = a.Description,
                    StartingPrice = a.StartingPrice,
                    CurrentPrice = a.CurrentPrice,
                    EndsAt = a.EndsAt,
                    IsActive = a.IsActive,
                    UserId = a.UserId
                });

            var auctions = await EntityFrameworkQueryableExtensions.ToListAsync(query);

            return Ok(auctions);
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<AuctionResponseDto>>> Search([FromQuery] string title)
        {
            if (string.IsNullOrWhiteSpace(title))
            {
                return Ok(new List<AuctionResponseDto>());
            }

            var query = _dbContext.Auctions
                .Where(a => a.IsActive && a.EndsAt > DateTime.UtcNow && a.Title.Contains(title))
                .OrderBy(a => a.EndsAt)
                .Select(a => new AuctionResponseDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Description = a.Description,
                    StartingPrice = a.StartingPrice,
                    CurrentPrice = a.CurrentPrice,
                    EndsAt = a.EndsAt,
                    IsActive = a.IsActive,
                    UserId = a.UserId
                });

            var auctions = await EntityFrameworkQueryableExtensions.ToListAsync(query);

            return Ok(auctions);
        }

        [Authorize]
        [HttpGet("mine")]
        public async Task<ActionResult<IEnumerable<AuctionResponseDto>>> GetMyAuctions()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(ClaimTypes.Name);
            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var query = _dbContext.Auctions
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.EndsAt)
                .Select(a => new AuctionResponseDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Description = a.Description,
                    StartingPrice = a.StartingPrice,
                    CurrentPrice = a.CurrentPrice,
                    EndsAt = a.EndsAt,
                    IsActive = a.IsActive,
                    UserId = a.UserId
                });

            var auctions = await EntityFrameworkQueryableExtensions.ToListAsync(query);

            return Ok(auctions);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<AuctionResponseDto>> GetById(int id)
        {
            var query = _dbContext.Auctions
                .Where(a => a.Id == id)
                .Select(a => new AuctionResponseDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Description = a.Description,
                    StartingPrice = a.StartingPrice,
                    CurrentPrice = a.CurrentPrice,
                    EndsAt = a.EndsAt,
                    IsActive = a.IsActive,
                    UserId = a.UserId
                });

            var auction = await EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(query);

            if (auction == null)
            {
                return NotFound();
            }

            return Ok(auction);
        }

        [Authorize]
        [HttpPost]
        public async Task<ActionResult<AuctionResponseDto>> Create(CreateAuctionDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title) || dto.StartingPrice <= 0 || dto.EndsAt <= DateTime.UtcNow)
            {
                return BadRequest("Title, starting price, and a future end date are required.");
            }

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(ClaimTypes.Name);
            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var auction = new Auction
            {
                Title = dto.Title,
                Description = dto.Description,
                StartingPrice = dto.StartingPrice,
                CurrentPrice = dto.StartingPrice,
                EndsAt = dto.EndsAt,
                UserId = userId
            };

            _dbContext.Auctions.Add(auction);
            await _dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = auction.Id }, new AuctionResponseDto
            {
                Id = auction.Id,
                Title = auction.Title,
                Description = auction.Description,
                StartingPrice = auction.StartingPrice,
                CurrentPrice = auction.CurrentPrice,
                EndsAt = auction.EndsAt,
                IsActive = auction.IsActive,
                UserId = auction.UserId
            });
        }

        [Authorize]
        [HttpPut("{id:int}")]
        public async Task<ActionResult<AuctionResponseDto>> Update(int id, UpdateAuctionDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title) || dto.StartingPrice <= 0 || dto.EndsAt <= DateTime.UtcNow)
            {
                return BadRequest("Title, starting price, and a future end date are required.");
            }

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(ClaimTypes.Name);
            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var auction = await _dbContext.Auctions.FirstOrDefaultAsync(a => a.Id == id);
            if (auction == null)
            {
                return NotFound();
            }

            if (auction.UserId != userId)
            {
                return Forbid();
            }

            auction.Title = dto.Title;
            auction.Description = dto.Description;
            auction.StartingPrice = dto.StartingPrice;
            auction.EndsAt = dto.EndsAt;
            auction.IsActive = dto.IsActive;

            await _dbContext.SaveChangesAsync();

            return Ok(new AuctionResponseDto
            {
                Id = auction.Id,
                Title = auction.Title,
                Description = auction.Description,
                StartingPrice = auction.StartingPrice,
                CurrentPrice = auction.CurrentPrice,
                EndsAt = auction.EndsAt,
                IsActive = auction.IsActive,
                UserId = auction.UserId
            });
        }

        [HttpGet("{auctionId:int}/bids")]
        public async Task<ActionResult<IEnumerable<BidResponseDto>>> GetBids(int auctionId)
        {
            var auctionExists = await _dbContext.Auctions.AnyAsync(a => a.Id == auctionId);
            if (!auctionExists)
            {
                return NotFound("Auction not found.");
            }

            var query = _dbContext.Bids
                .Where(b => b.AuctionId == auctionId)
                .OrderByDescending(b => b.Amount)
                .Select(b => new BidResponseDto
                {
                    Id = b.Id,
                    Amount = b.Amount,
                    CreatedAt = b.CreatedAt,
                    UserId = b.UserId,
                    AuctionId = b.AuctionId
                });

            var bids = await EntityFrameworkQueryableExtensions.ToListAsync(query);
            return Ok(bids);
        }

        [Authorize]
        [HttpPost("{auctionId:int}/bids")]
        public async Task<ActionResult<BidResponseDto>> CreateBid(int auctionId, CreateBidDto dto)
        {
            if (dto.Amount <= 0)
            {
                return BadRequest("Bid amount must be greater than zero.");
            }

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(ClaimTypes.Name);
            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var auction = await _dbContext.Auctions
                .Include(a => a.Bids)
                .FirstOrDefaultAsync(a => a.Id == auctionId);

            if (auction == null)
            {
                return NotFound("Auction not found.");
            }

            if (!auction.IsActive || auction.EndsAt <= DateTime.UtcNow)
            {
                return BadRequest("Auction is closed.");
            }

            if (auction.UserId == userId)
            {
                return BadRequest("You cannot bid on your own auction.");
            }

            var currentHighest = auction.Bids.Count == 0
                ? auction.StartingPrice
                : auction.Bids.Max(b => b.Amount);

            if (dto.Amount <= currentHighest)
            {
                return BadRequest("Bid must be higher than the current highest bid.");
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

            return Ok(new BidResponseDto
            {
                Id = bid.Id,
                Amount = bid.Amount,
                CreatedAt = bid.CreatedAt,
                UserId = bid.UserId,
                AuctionId = bid.AuctionId
            });
        }
    }
}
