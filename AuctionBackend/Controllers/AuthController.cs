using System.Security.Claims;
using System.Threading.Tasks;
using AuctionBackend.Data;
using AuctionBackend.DTOs;
using AuctionBackend.Interfaces;
using AuctionBackend.Models;
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
        private readonly IAuthService _authService;
        private readonly AppDbContext _dbContext;
        private readonly PasswordHasher<User> _passwordHasher = new();

        public AuthController(IAuthService authService, AppDbContext dbContext)
        {
            _authService = authService;
            _dbContext = dbContext;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            var result = await _authService.RegisterAsync(dto);
            if (result.IsSuccess)
            {
                return Ok(new { token = result.Data });
            }

            return result.StatusCode == 400
                ? BadRequest(result.Error)
                : StatusCode(result.StatusCode, result.Error);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto);
            if (result.IsSuccess)
            {
                return Ok(new { token = result.Data });
            }

            return result.StatusCode switch
            {
                400 => BadRequest(result.Error),
                401 => Unauthorized(result.Error),
                _ => StatusCode(result.StatusCode, result.Error)
            };
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
