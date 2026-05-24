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
    }
}
