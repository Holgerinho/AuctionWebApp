using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AuctionBackend.Data;
using AuctionBackend.DTOs;
using AuctionBackend.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AuctionBackend.Services
{
    public class AdminService : IAdminService
    {
        private readonly AppDbContext _dbContext;

        public AdminService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<IEnumerable<AdminUserDto>> GetUsersAsync()
        {
            return await _dbContext.Users
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
        }

        public async Task<OperationResult<bool>> DeactivateUserAsync(int id)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null)
            {
                return OperationResult<bool>.Failure(404, "User not found.");
            }

            if (user.Role == "Admin")
            {
                return OperationResult<bool>.Failure(400, "Admin users cannot be deactivated.");
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
            return OperationResult<bool>.Success(true, 204);
        }

        public async Task<OperationResult<bool>> ActivateUserAsync(int id)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null)
            {
                return OperationResult<bool>.Failure(404, "User not found.");
            }

            user.IsActive = true;
            await _dbContext.SaveChangesAsync();
            return OperationResult<bool>.Success(true, 204);
        }

        public async Task<IEnumerable<AdminAuctionDto>> GetAuctionsAsync()
        {
            return await _dbContext.Auctions
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
        }

        public async Task<OperationResult<bool>> DeactivateAuctionAsync(int id)
        {
            var auction = await _dbContext.Auctions.FirstOrDefaultAsync(a => a.Id == id);
            if (auction == null)
            {
                return OperationResult<bool>.Failure(404, "Auction not found.");
            }

            auction.IsActive = false;
            await _dbContext.SaveChangesAsync();
            return OperationResult<bool>.Success(true, 204);
        }

        public async Task<OperationResult<bool>> ActivateAuctionAsync(int id)
        {
            var auction = await _dbContext.Auctions.FirstOrDefaultAsync(a => a.Id == id);
            if (auction == null)
            {
                return OperationResult<bool>.Failure(404, "Auction not found.");
            }

            auction.IsActive = true;
            await _dbContext.SaveChangesAsync();
            return OperationResult<bool>.Success(true, 204);
        }
    }
}
