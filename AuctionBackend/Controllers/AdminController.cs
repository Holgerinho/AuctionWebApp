using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AuctionBackend.Data;
using AuctionBackend.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AuctionBackend.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public AdminController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet("users")]
        public async Task<ActionResult<IEnumerable<AdminUserDto>>> GetUsers()
        {
            var users = await _dbContext.Users
                .OrderBy(u => u.UserName)
                .Select(u => new AdminUserDto
                {
                    Id = u.Id,
                    UserName = u.UserName,
                    Email = u.Email,
                    Role = u.Role,
                    IsActive = u.IsActive,
                    CreatedAt = DateTime.SpecifyKind(u.CreatedAt, DateTimeKind.Utc)
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpPut("users/{id:int}/deactivate")]
        public async Task<IActionResult> DeactivateUser(int id)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            if (user.Role == "Admin")
            {
                return BadRequest("Admin users cannot be deactivated.");
            }

            user.IsActive = false;

            var userAuctions = await _dbContext.Auctions
                .Where(a => a.UserId == user.Id && a.IsActive)
                .ToListAsync();

            foreach (var auction in userAuctions)
            {
                auction.IsActive = false;
            }

            await _dbContext.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("users/{id:int}/activate")]
        public async Task<IActionResult> ActivateUser(int id)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            user.IsActive = true;
            await _dbContext.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("auctions")]
        public async Task<ActionResult<IEnumerable<AdminAuctionDto>>> GetAuctions()
        {
            var auctions = await _dbContext.Auctions
                .OrderByDescending(a => a.EndsAt)
                .Select(a => new AdminAuctionDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Description = a.Description,
                    StartingPrice = a.StartingPrice,
                    CurrentPrice = a.CurrentPrice,
                    StartsAt = DateTime.SpecifyKind(a.StartsAt, DateTimeKind.Utc),
                    EndsAt = DateTime.SpecifyKind(a.EndsAt, DateTimeKind.Utc),
                    IsActive = a.IsActive,
                    UserId = a.UserId,
                    OwnerUserName = a.User.UserName
                })
                .ToListAsync();

            return Ok(auctions);
        }

        [HttpPut("auctions/{id:int}/deactivate")]
        public async Task<IActionResult> DeactivateAuction(int id)
        {
            var auction = await _dbContext.Auctions.FirstOrDefaultAsync(a => a.Id == id);
            if (auction == null)
            {
                return NotFound("Auction not found.");
            }

            auction.IsActive = false;
            await _dbContext.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("auctions/{id:int}/activate")]
        public async Task<IActionResult> ActivateAuction(int id)
        {
            var auction = await _dbContext.Auctions.FirstOrDefaultAsync(a => a.Id == id);
            if (auction == null)
            {
                return NotFound("Auction not found.");
            }

            auction.IsActive = true;
            await _dbContext.SaveChangesAsync();
            return NoContent();
        }
    }
}
