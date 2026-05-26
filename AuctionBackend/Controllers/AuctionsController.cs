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
                    EndsAt = DateTime.SpecifyKind(a.EndsAt, DateTimeKind.Utc),
                    IsActive = a.IsActive,
                    UserId = a.UserId
                });

            var auctions = await EntityFrameworkQueryableExtensions.ToListAsync(query);

            return Ok(auctions);
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<AuctionResponseDto>>> Search([FromQuery] string? title)
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
                    EndsAt = DateTime.SpecifyKind(a.EndsAt, DateTimeKind.Utc),
                    IsActive = a.IsActive,
                    UserId = a.UserId
                });

            var auctions = await EntityFrameworkQueryableExtensions.ToListAsync(query);

            return Ok(auctions);
        }

        [HttpGet("closed")]
        public async Task<ActionResult<IEnumerable<AuctionResponseDto>>> GetClosedAuctions([FromQuery] string? title)
        {
            var query = _dbContext.Auctions
                .Where(a => a.IsActive && a.EndsAt <= DateTime.UtcNow);

            if (!string.IsNullOrWhiteSpace(title))
            {
                query = query.Where(a => a.Title.Contains(title));
            }

            var results = await query
                .OrderByDescending(a => a.EndsAt)
                .Select(a => new AuctionResponseDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Description = a.Description,
                    StartingPrice = a.StartingPrice,
                    CurrentPrice = a.CurrentPrice,
                    EndsAt = DateTime.SpecifyKind(a.EndsAt, DateTimeKind.Utc),
                    IsActive = a.IsActive,
                    UserId = a.UserId
                })
                .ToListAsync();

            return Ok(results);
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
                    EndsAt = DateTime.SpecifyKind(a.EndsAt, DateTimeKind.Utc),
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
                    EndsAt = DateTime.SpecifyKind(a.EndsAt, DateTimeKind.Utc),
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
            var endsAtUtc = NormalizeToUtc(dto.EndsAt);

            if (string.IsNullOrWhiteSpace(dto.Title) || dto.StartingPrice <= 0 || endsAtUtc <= DateTime.UtcNow)
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
                EndsAt = endsAtUtc,
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
                EndsAt = DateTime.SpecifyKind(auction.EndsAt, DateTimeKind.Utc),
                IsActive = auction.IsActive,
                UserId = auction.UserId
            });
        }

        [Authorize]
        [HttpPut("{id:int}")]
        public async Task<ActionResult<AuctionResponseDto>> Update(int id, UpdateAuctionDto dto)
        {
            var endsAtUtc = NormalizeToUtc(dto.EndsAt);

            if (string.IsNullOrWhiteSpace(dto.Title) || dto.StartingPrice <= 0 || endsAtUtc <= DateTime.UtcNow)
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

            var hasBids = await _dbContext.Bids.AnyAsync(b => b.AuctionId == id);
            if (hasBids && dto.StartingPrice != auction.StartingPrice)
            {
                return BadRequest("Starting price cannot be changed after bids have been placed.");
            }

            auction.Title = dto.Title;
            auction.Description = dto.Description;
            auction.StartingPrice = dto.StartingPrice;
            if (!hasBids)
            {
                auction.CurrentPrice = dto.StartingPrice;
            }
            auction.EndsAt = endsAtUtc;
            auction.IsActive = dto.IsActive;

            await _dbContext.SaveChangesAsync();

            return Ok(new AuctionResponseDto
            {
                Id = auction.Id,
                Title = auction.Title,
                Description = auction.Description,
                StartingPrice = auction.StartingPrice,
                CurrentPrice = auction.CurrentPrice,
                EndsAt = DateTime.SpecifyKind(auction.EndsAt, DateTimeKind.Utc),
                IsActive = auction.IsActive,
                UserId = auction.UserId
            });
        }

    }
}
