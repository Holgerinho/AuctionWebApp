using System.Threading.Tasks;
using AuctionBackend.Data;
using AuctionBackend.DTOs;
using AuctionBackend.Interfaces;
using AuctionBackend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AuctionBackend.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _dbContext;
        private readonly TokenService _tokenService;
        private readonly PasswordHasher<User> _passwordHasher = new();

        public AuthService(AppDbContext dbContext, TokenService tokenService)
        {
            _dbContext = dbContext;
            _tokenService = tokenService;
        }

        public async Task<OperationResult<string>> RegisterAsync(RegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.UserName) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return OperationResult<string>.Failure(400, "Username, email, and password are required.");
            }

            var existingUser = await _dbContext.Users
                .AnyAsync(u => u.UserName == dto.UserName || u.Email == dto.Email);

            if (existingUser)
            {
                return OperationResult<string>.Failure(400, "Username or email already exists.");
            }

            var user = new User
            {
                UserName = dto.UserName,
                Email = dto.Email,
                Role = "User",
                IsActive = true
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            var token = _tokenService.CreateToken(user);
            return OperationResult<string>.Success(token);
        }

        public async Task<OperationResult<string>> LoginAsync(LoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.UserNameOrEmail) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return OperationResult<string>.Failure(400, "Username/email and password are required.");
            }

            var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.UserName == dto.UserNameOrEmail || u.Email == dto.UserNameOrEmail);

            if (user == null)
            {
                return OperationResult<string>.Failure(401, "Invalid credentials.");
            }

            if (!user.IsActive)
            {
                return OperationResult<string>.Failure(401, "This account is inactive.");
            }

            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
            if (result == PasswordVerificationResult.Failed)
            {
                return OperationResult<string>.Failure(401, "Invalid credentials.");
            }

            var token = _tokenService.CreateToken(user);
            return OperationResult<string>.Success(token);
        }
    }
}
