using System.Security.Claims;
using System.Threading.Tasks;
using AuctionBackend.Data;
using AuctionBackend.DTOs;
using AuctionBackend.Models;
using AuctionBackend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AuctionBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _dbContext;
        private readonly TokenService _tokenService;
        private readonly PasswordHasher<User> _passwordHasher = new();

        public AuthController(AppDbContext dbContext, TokenService tokenService)
        {
            _dbContext = dbContext;
            _tokenService = tokenService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.UserName) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest("Username, email, and password are required.");
            }

            var existingUser = await _dbContext.Users
                .AnyAsync(u => u.UserName == dto.UserName || u.Email == dto.Email);

            if (existingUser)
            {
                return BadRequest("Username or email already exists.");
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
            return Ok(new { token });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.UserNameOrEmail) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest("Username/email and password are required.");
            }

            var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.UserName == dto.UserNameOrEmail || u.Email == dto.UserNameOrEmail);

            if (user == null)
            {
                return Unauthorized("Invalid credentials.");
            }

            if (!user.IsActive)
            {
                return Unauthorized("This account is inactive.");
            }

            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
            if (result == PasswordVerificationResult.Failed)
            {
                return Unauthorized("Invalid credentials.");
            }

            var token = _tokenService.CreateToken(user);
            return Ok(new { token });
        }

        [Authorize]
        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CurrentPassword) || string.IsNullOrWhiteSpace(dto.NewPassword))
            {
                return BadRequest("Current and new password are required.");
            }

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(ClaimTypes.Name);
            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.CurrentPassword);
            if (result == PasswordVerificationResult.Failed)
            {
                return BadRequest("Current password is incorrect.");
            }

            user.PasswordHash = _passwordHasher.HashPassword(user, dto.NewPassword);
            await _dbContext.SaveChangesAsync();

            return Ok(new { message = "Password updated." });
        }
    }
}
