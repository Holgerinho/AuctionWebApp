using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using AuctionBackend.Data;
using AuctionBackend.DTOs;
using AuctionBackend.Interfaces;
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
        private readonly IAuctionService _auctionService;

        public BidsController(AppDbContext dbContext, IAuctionService auctionService)
        {
            _dbContext = dbContext;
            _auctionService = auctionService;
        }

        [HttpGet("auctions/{auctionId:int}/bids")]
        public async Task<ActionResult<IEnumerable<BidResponseDto>>> GetBids(int auctionId)
        {
            var result = await _auctionService.GetBidsAsync(auctionId);
            if (result.IsSuccess && result.Data != null)
            {
                return Ok(result.Data);
            }

            return result.StatusCode == 404
                ? NotFound(result.Error)
                : StatusCode(result.StatusCode, result.Error);
        }

        [Authorize]
        [HttpPost("auctions/{auctionId:int}/bids")]
        public async Task<ActionResult<BidResponseDto>> CreateBid(int auctionId, CreateBidDto dto)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(ClaimTypes.Name);
            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var result = await _auctionService.CreateBidAsync(auctionId, dto, userId);
            if (result.IsSuccess && result.Data != null)
            {
                return Ok(result.Data);
            }

            return result.StatusCode switch
            {
                400 => BadRequest(result.Error),
                404 => NotFound(result.Error),
                _ => StatusCode(result.StatusCode, result.Error)
            };
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
