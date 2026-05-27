using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using AuctionBackend.DTOs;
using AuctionBackend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuctionBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuctionsController : ControllerBase
    {
        private readonly IAuctionService _auctionService;

        public AuctionsController(IAuctionService auctionService)
        {
            _auctionService = auctionService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AuctionResponseDto>>> GetAuctions()
        {
            var auctions = await _auctionService.GetOpenAuctionsAsync();
            return Ok(auctions);
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<AuctionResponseDto>>> Search([FromQuery] string? title)
        {
            var auctions = await _auctionService.SearchOpenAuctionsAsync(title ?? string.Empty);
            return Ok(auctions);
        }

        [HttpGet("closed")]
        public async Task<ActionResult<IEnumerable<AuctionResponseDto>>> GetClosedAuctions([FromQuery] string? title)
        {
            var results = await _auctionService.GetClosedAuctionsAsync(title);
            return Ok(results);
        }

        [Authorize]
        [HttpGet("mine")]
        public async Task<ActionResult<IEnumerable<AuctionResponseDto>>> GetMyAuctions()
        {
            if (!TryGetUserId(out var userId))
            {
                return Unauthorized();
            }

            var auctions = await _auctionService.GetMyAuctionsAsync(userId);
            return Ok(auctions);
        }

        [Authorize]
        [HttpGet("mine/bids")]
        public async Task<ActionResult<IEnumerable<AuctionResponseDto>>> GetAuctionsIBidOn()
        {
            if (!TryGetUserId(out var userId))
            {
                return Unauthorized();
            }

            var auctions = await _auctionService.GetAuctionsIBidOnAsync(userId);
            return Ok(auctions);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<AuctionResponseDto>> GetById(int id)
        {
            var auction = await _auctionService.GetByIdAsync(id);

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
            if (!TryGetUserId(out var userId))
            {
                return Unauthorized();
            }

            var result = await _auctionService.CreateAsync(dto, userId);
            if (!result.IsSuccess || result.Data == null)
            {
                return result.StatusCode == 400
                    ? BadRequest(result.Error)
                    : StatusCode(result.StatusCode, result.Error);
            }

            return CreatedAtAction(nameof(GetById), new { id = result.Data.Id }, result.Data);
        }

        [Authorize]
        [HttpPut("{id:int}")]
        public async Task<ActionResult<AuctionResponseDto>> Update(int id, UpdateAuctionDto dto)
        {
            if (!TryGetUserId(out var userId))
            {
                return Unauthorized();
            }

            var result = await _auctionService.UpdateAsync(id, dto, userId);
            if (result.IsSuccess && result.Data != null)
            {
                return Ok(result.Data);
            }

            return result.StatusCode switch
            {
                400 => BadRequest(result.Error),
                403 => Forbid(),
                404 => NotFound(),
                _ => StatusCode(result.StatusCode, result.Error)
            };
        }

        private bool TryGetUserId(out int userId)
        {
            userId = default;
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(ClaimTypes.Name);
            return !string.IsNullOrWhiteSpace(userIdClaim) && int.TryParse(userIdClaim, out userId);
        }

    }
}
