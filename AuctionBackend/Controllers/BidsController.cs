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
    [Route("api")]
    public class BidsController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public BidsController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet("auctions/{auctionId:int}/bids")]
        public async Task<ActionResult<IEnumerable<BidResponseDto>>> GetBids(int auctionId)
        {
            var auctionExists = await _dbContext.Auctions.AnyAsync(a => a.Id == auctionId);
            if (!auctionExists)
            {
                return NotFound("Auction not found.");
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

            return Ok(bids);
        }

        [Authorize]
        [HttpPost("auctions/{auctionId:int}/bids")]
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

        [Authorize]
        [HttpDelete("bids/{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(ClaimTypes.Name);
            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var bid = await _dbContext.Bids
                .Include(b => b.Auction)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (bid == null)
            {
                return NotFound("Bid not found.");
            }

            if (bid.UserId != userId)
            {
                return Forbid();
            }

            var auction = bid.Auction;
            if (!auction.IsActive || auction.EndsAt <= DateTime.UtcNow)
            {
                return BadRequest("Bids can only be deleted while the auction is open.");
            }

            var latestBid = await _dbContext.Bids
                .Where(b => b.AuctionId == auction.Id)
                .OrderByDescending(b => b.CreatedAt)
                .ThenByDescending(b => b.Id)
                .FirstOrDefaultAsync();

            if (latestBid == null || latestBid.Id != bid.Id)
            {
                return BadRequest("Only the latest bid can be deleted.");
            }

            _dbContext.Bids.Remove(bid);

            var nextHighest = await _dbContext.Bids
                .Where(b => b.AuctionId == auction.Id && b.Id != bid.Id)
                .OrderByDescending(b => b.Amount)
                .Select(b => (decimal?)b.Amount)
                .FirstOrDefaultAsync();

            auction.CurrentPrice = nextHighest ?? auction.StartingPrice;

            await _dbContext.SaveChangesAsync();
            return NoContent();
        }
    }
}
